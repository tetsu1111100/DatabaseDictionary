using Microsoft.Data.SqlClient;

namespace DatabaseDictionary.Infrastructure.Data;

/// <summary>Creates the app's own metadata tables on startup if they don't exist yet. No EF/Dapper migration tooling is used, so this idempotent script is the entire schema history.</summary>
public static class SchemaInitializer
{
    private const string Script = """
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
                ConnPassword NVARCHAR(200) NULL,
                UseWindowsAuth BIT NOT NULL CONSTRAINT DF_TableHeader_UseWindowsAuth DEFAULT (0),
                CONSTRAINT UQ_TableHeader_HostDbObject UNIQUE (DatabaseHost, DatabaseName, ObjectName)
            );
        END

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
                ParamDirection NVARCHAR(10) NULL,
                Remark NVARCHAR(MAX) NULL,
                CONSTRAINT FK_TableColumn_TableHeader FOREIGN KEY (HeaderId) REFERENCES dbo.TableHeader (HeaderId) ON DELETE CASCADE
            );
            CREATE INDEX IX_TableColumn_HeaderId ON dbo.TableColumn (HeaderId);
        END

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
        """;

    public static async Task EnsureCreatedAsync(string connectionString)
    {
        await EnsureDatabaseExistsAsync(connectionString);

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = Script;
        await command.ExecuteNonQueryAsync();
    }

    /// <summary>Creates the target database itself (against master) if it doesn't exist yet — a fresh SQL Server instance won't have it.</summary>
    private static async Task EnsureDatabaseExistsAsync(string connectionString)
    {
        var builder = new SqlConnectionStringBuilder(connectionString);
        var databaseName = builder.InitialCatalog;
        if (string.IsNullOrWhiteSpace(databaseName))
        {
            return;
        }

        builder.InitialCatalog = "master";
        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync();

        await using var checkCommand = connection.CreateCommand();
        checkCommand.CommandText = "SELECT DB_ID(@DatabaseName)";
        checkCommand.Parameters.AddWithValue("@DatabaseName", databaseName);
        var existingId = await checkCommand.ExecuteScalarAsync();
        if (existingId is not null and not DBNull)
        {
            return;
        }

        await using var createCommand = connection.CreateCommand();
        createCommand.CommandText = $"CREATE DATABASE [{databaseName.Replace("]", "]]")}]";
        await createCommand.ExecuteNonQueryAsync();
    }
}
