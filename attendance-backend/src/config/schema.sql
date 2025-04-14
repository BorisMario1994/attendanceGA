IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'attendance_db')
BEGIN
    CREATE DATABASE attendance_db;
END
GO

USE attendance_db;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[employees_GA]') AND type in (N'U'))
BEGIN
    CREATE TABLE employees_GA (
        id INT IDENTITY(1,1) PRIMARY KEY,
        employee_id VARCHAR(8) NOT NULL UNIQUE,
        otp_secret VARCHAR(255) NOT NULL,
        photo TEXT,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Drop existing attendance_records table if it exists
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[attendance_records]') AND type in (N'U'))
BEGIN
    DROP TABLE attendance_records;
END
GO

-- Create new attendance_records table with stat column and image
CREATE TABLE attendance_records (
    id INT IDENTITY(1,1) PRIMARY KEY,
    employee_id VARCHAR(8) NOT NULL,
    stat VARCHAR(20) NOT NULL,
    image TEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (employee_id) REFERENCES employees_GA(employee_id)
);
GO

-- Create admin table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[admins]') AND type in (N'U'))
BEGIN
    CREATE TABLE admins (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );

    -- Insert default admin user with password '123456'
    -- Hash generated using bcrypt with 10 rounds
    INSERT INTO admins (username, password_hash)
    VALUES ('admin', '$2a$10$8TtEiGR8KY8S4QjHGKiqxOfevXV0Zj9qA4PszPYoPBLVOFAZAPqe.');
END
GO

-- Create trigger for updated_at
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_employees_GA_UpdatedAt')
BEGIN
    CREATE TRIGGER TR_employees_GA_UpdatedAt
    ON employees_GA
    AFTER UPDATE
    AS
    BEGIN
        UPDATE employees_GA
        SET updated_at = GETDATE()
        FROM employees_GA e
        INNER JOIN inserted i ON e.id = i.id
    END
END
GO

-- Enable external scripts if not already enabled
sp_configure 'external scripts enabled', 1;
GO
RECONFIGURE;
GO

-- Create stored procedure for face comparison with date range
CREATE OR ALTER PROCEDURE sp_CompareFaces
    @DateFrom DATETIME2,
    @DateTo DATETIME2,
    @Type VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate parameters
    IF @Type NOT IN ('clockin', 'clockout')
    BEGIN
        RAISERROR ('Type must be either "clockin" or "clockout"', 16, 1);
        RETURN;
    END

    -- Create temporary table to store results
    CREATE TABLE #FaceComparisonResults (
        AttendanceId INT,
        EmployeeId VARCHAR(8),
        AttendanceDate DATETIME2,
        FaceMatch BIT,
        Confidence FLOAT,
        ErrorMessage NVARCHAR(MAX)
    );

    -- Get all attendance records in the date range
    DECLARE @CurrentAttendanceId INT;
    DECLARE @CurrentEmployeeId VARCHAR(8);
    DECLARE @RegPhoto NVARCHAR(MAX);
    DECLARE @AttendancePhoto NVARCHAR(MAX);
    DECLARE @PythonScript NVARCHAR(MAX);
    
    -- Cursor to process each attendance record
    DECLARE attendance_cursor CURSOR FOR
    SELECT 
        ar.id,
        ar.employee_id,
        ar.image,
        e.photo
    FROM attendance_records ar
    JOIN employees_GA e ON ar.employee_id = e.employee_id
    WHERE ar.created_at BETWEEN @DateFrom AND @DateTo
    AND ar.stat = @Type
    AND ar.image IS NOT NULL
    AND e.photo IS NOT NULL;

    -- Set up Python script
    SET @PythonScript = N'
    import sys
    sys.path.append("D:/attendanceGA/attendance-backend/src/utils")
    import face_compare
    import json

    result = face_compare.compare_faces(reg_photo, attendance_photo)
    print(json.dumps(result))
    ';

    OPEN attendance_cursor;
    FETCH NEXT FROM attendance_cursor INTO @CurrentAttendanceId, @CurrentEmployeeId, @AttendancePhoto, @RegPhoto;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Execute Python script for each record
        BEGIN TRY
            INSERT INTO #FaceComparisonResults (AttendanceId, EmployeeId, AttendanceDate, FaceMatch, Confidence, ErrorMessage)
            EXEC sp_execute_external_script
                @language = N'Python',
                @script = @PythonScript,
                @params = N'@reg_photo nvarchar(max), @attendance_photo nvarchar(max)',
                @reg_photo = @RegPhoto,
                @attendance_photo = @AttendancePhoto
            WITH RESULT SETS
            ((
                AttendanceId INT,
                EmployeeId VARCHAR(8),
                AttendanceDate DATETIME2,
                FaceMatch BIT,
                Confidence FLOAT,
                ErrorMessage NVARCHAR(MAX
            ));

            -- Update the results with additional info
            UPDATE #FaceComparisonResults
            SET 
                AttendanceId = @CurrentAttendanceId,
                EmployeeId = @CurrentEmployeeId,
                AttendanceDate = (SELECT created_at FROM attendance_records WHERE id = @CurrentAttendanceId)
            WHERE AttendanceId IS NULL;

        END TRY
        BEGIN CATCH
            INSERT INTO #FaceComparisonResults (
                AttendanceId,
                EmployeeId,
                AttendanceDate,
                FaceMatch,
                Confidence,
                ErrorMessage
            )
            VALUES (
                @CurrentAttendanceId,
                @CurrentEmployeeId,
                (SELECT created_at FROM attendance_records WHERE id = @CurrentAttendanceId),
                0,
                0.0,
                ERROR_MESSAGE()
            );
        END CATCH

        FETCH NEXT FROM attendance_cursor INTO @CurrentAttendanceId, @CurrentEmployeeId, @AttendancePhoto, @RegPhoto;
    END

    CLOSE attendance_cursor;
    DEALLOCATE attendance_cursor;

    -- Return results
    SELECT 
        r.AttendanceId,
        r.EmployeeId,
        r.AttendanceDate,
        r.FaceMatch,
        r.Confidence,
        r.ErrorMessage,
        ar.stat as AttendanceType
    FROM #FaceComparisonResults r
    JOIN attendance_records ar ON r.AttendanceId = ar.id
    ORDER BY r.AttendanceDate;

    -- Cleanup
    DROP TABLE #FaceComparisonResults;
END;
GO