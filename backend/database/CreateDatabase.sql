/*
    DatabaseDictionary 系統資料庫建置腳本
    =====================================
    用途：建立本系統自身用來存放「表頭／表身／程式使用清單」中繼資料的資料庫與資料表。
    這裡建立的是系統自己的資料庫，不是規格書中被記錄／被比對的「來源資料庫」。

    此腳本與後端專案 SchemaInitializer.cs 內建的自動建置邏輯完全一致（IF NOT EXISTS 寫法，可重複執行）。
    後端第一次啟動時也會自動執行相同邏輯，所以這支腳本是「選用」的：
      - 若想先手動建好資料庫／資料表再啟動系統，用這支腳本。
      - 若略過不執行，直接啟動後端，系統也會自動建立。

    若要更換資料庫名稱，請將下方所有 [DatabaseDictionary] 一併改名，
    並同步修改 backend/src/DatabaseDictionary.Api/appsettings.json 的連線字串。
*/

-- 1. 建立資料庫（若不存在）
IF DB_ID(N'DatabaseDictionary') IS NULL
BEGIN
    CREATE DATABASE [DatabaseDictionary];
END
GO

USE [DatabaseDictionary];
GO

-- 2. 表頭：TableHeader
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TableHeader')
BEGIN
    CREATE TABLE dbo.TableHeader
    (
        HeaderId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TableHeader PRIMARY KEY,
        DatabaseName NVARCHAR(200) NOT NULL,
        DatabaseHost NVARCHAR(200) NOT NULL,
        ObjectType NVARCHAR(50) NOT NULL,
        ObjectName NVARCHAR(200) NOT NULL,
        TableDescription NVARCHAR(MAX) NULL,
        OtherDescription NVARCHAR(MAX) NULL,
        Remark NVARCHAR(MAX) NULL,
        ConnPort NVARCHAR(20) NULL,
        ConnAccount NVARCHAR(200) NULL,
        ConnPassword NVARCHAR(200) NULL,          -- 明文儲存（依需求確認採用，非加密）
        UseWindowsAuth BIT NOT NULL CONSTRAINT DF_TableHeader_UseWindowsAuth DEFAULT (0),
        CONSTRAINT UQ_TableHeader_HostDbObject UNIQUE (DatabaseHost, DatabaseName, ObjectName)
    );
END
GO

-- 3. 表身：TableColumn（隨表頭 cascade delete）
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'TableColumn')
BEGIN
    CREATE TABLE dbo.TableColumn
    (
        ColumnId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TableColumn PRIMARY KEY,
        HeaderId INT NOT NULL,
        Sequence INT NOT NULL,
        ColumnName NVARCHAR(200) NOT NULL,
        ColumnDescription NVARCHAR(MAX) NULL,
        DataType NVARCHAR(200) NOT NULL,
        IsNullable BIT NOT NULL CONSTRAINT DF_TableColumn_IsNullable DEFAULT (1),
        DefaultValue NVARCHAR(500) NULL,
        IsPrimaryKey BIT NOT NULL CONSTRAINT DF_TableColumn_IsPrimaryKey DEFAULT (0),
        IsIdentity BIT NOT NULL CONSTRAINT DF_TableColumn_IsIdentity DEFAULT (0),
        ParamDirection NVARCHAR(10) NULL,          -- IN / OUT，僅 Function／Stored Procedure 使用
        Remark NVARCHAR(MAX) NULL,
        CONSTRAINT FK_TableColumn_TableHeader FOREIGN KEY (HeaderId) REFERENCES dbo.TableHeader (HeaderId) ON DELETE CASCADE
    );
    CREATE INDEX IX_TableColumn_HeaderId ON dbo.TableColumn (HeaderId);
END
GO

-- 4. 程式使用清單：ProgramUsage（隨表頭 cascade delete）
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ProgramUsage')
BEGIN
    CREATE TABLE dbo.ProgramUsage
    (
        HeaderId INT NOT NULL,
        SeqNo INT NOT NULL,
        ProgramName NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        CONSTRAINT PK_ProgramUsage PRIMARY KEY (HeaderId, SeqNo),
        CONSTRAINT FK_ProgramUsage_TableHeader FOREIGN KEY (HeaderId) REFERENCES dbo.TableHeader (HeaderId) ON DELETE CASCADE
    );
END
GO
