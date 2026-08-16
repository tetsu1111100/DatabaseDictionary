namespace DatabaseDictionary.Core.Entities;

public class TableColumn
{
    public int ColumnId { get; set; }
    public int HeaderId { get; set; }
    public int Sequence { get; set; }
    public string ColumnName { get; set; } = string.Empty;
    public string? ColumnDescription { get; set; }
    public string DataType { get; set; } = string.Empty;
    public bool IsNullable { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsPrimaryKey { get; set; }
    public bool IsIdentity { get; set; }

    /// <summary>IN or OUT, only meaningful when the parent header's ObjectType is Function/StoredProcedure.</summary>
    public string? ParamDirection { get; set; }
    public string? Remark { get; set; }
}
