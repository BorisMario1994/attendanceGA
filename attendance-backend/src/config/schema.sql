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

-- Create new attendance_records table with stat column
CREATE TABLE attendance_records (
    id INT IDENTITY(1,1) PRIMARY KEY,
    employee_id VARCHAR(8) NOT NULL,
    stat VARCHAR(20) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (employee_id) REFERENCES employees_GA(employee_id)
);
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