namespace DatabaseDictionary.Core.Dtos;

public class SchemaCompareRequest
{
    public string DatabaseHost { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string ObjectName { get; set; } = string.Empty;
    public string? ConnPort { get; set; }
    public string? ConnAccount { get; set; }
    public string? ConnPassword { get; set; }
    public bool UseWindowsAuth { get; set; }
}

/// <summary>Actual column structure read live from the target database — no PK/description merge logic here, that stays client-side.</summary>
public class ActualColumnDto
{
    public int Sequence { get; set; }
    public string ColumnName { get; set; } = string.Empty;
    public string DataType { get; set; } = string.Empty;
    public bool IsNullable { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsPrimaryKey { get; set; }
    public bool IsIdentity { get; set; }
}

public class SchemaCompareResult
{
    public List<ActualColumnDto> Columns { get; set; } = new();
}
