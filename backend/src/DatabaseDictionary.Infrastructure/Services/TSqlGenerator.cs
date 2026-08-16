using System.Text;
using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;

namespace DatabaseDictionary.Infrastructure.Services;

/// <summary>Builds T-SQL text for the user to copy into SSMS. Never executes anything against a database.</summary>
public class TSqlGenerator : ITSqlGenerator
{
    public string BuildCreateTable(CreateTableSqlRequest request)
    {
        var columns = request.Columns.OrderBy(c => c.Sequence).ToList();
        var sb = new StringBuilder();
        sb.Append($"CREATE TABLE {QuoteIdentifier(request.ObjectName)}\n(\n");

        var lines = columns.Select(c =>
            $"    {QuoteIdentifier(c.ColumnName)} {ColumnDefinition(c)}").ToList();

        var pkColumns = columns.Where(c => c.IsPrimaryKey).ToList();
        if (pkColumns.Count > 0)
        {
            var pkNames = string.Join(", ", pkColumns.Select(c => QuoteIdentifier(c.ColumnName)));
            lines.Add($"    CONSTRAINT {QuoteIdentifier($"PK_{request.ObjectName}")} PRIMARY KEY ({pkNames})");
        }

        sb.Append(string.Join(",\n", lines));
        sb.Append("\n);");
        return sb.ToString();
    }

    public string BuildAddColumn(ColumnSqlRequest request)
    {
        return $"ALTER TABLE {QuoteIdentifier(request.ObjectName)} ADD {QuoteIdentifier(request.Column.ColumnName)} {ColumnDefinition(request.Column)};";
    }

    public string BuildDropColumn(ColumnSqlRequest request)
    {
        return $"ALTER TABLE {QuoteIdentifier(request.ObjectName)} DROP COLUMN {QuoteIdentifier(request.Column.ColumnName)};";
    }

    public string BuildAlterColumn(ColumnSqlRequest request)
    {
        var c = request.Column;
        var nullability = c.IsNullable ? "NULL" : "NOT NULL";
        return $"ALTER TABLE {QuoteIdentifier(request.ObjectName)} ALTER COLUMN {QuoteIdentifier(c.ColumnName)} {c.DataType} {nullability};";
    }

    private static string ColumnDefinition(ColumnDto c)
    {
        var parts = new List<string> { c.DataType };

        if (c.IsIdentity)
        {
            parts.Add("IDENTITY(1,1)");
        }

        parts.Add(c.IsNullable ? "NULL" : "NOT NULL");

        if (!string.IsNullOrWhiteSpace(c.DefaultValue))
        {
            parts.Add($"DEFAULT {c.DefaultValue}");
        }

        return string.Join(" ", parts);
    }

    private static string QuoteIdentifier(string identifier)
    {
        return "[" + identifier.Replace("]", "]]") + "]";
    }
}
