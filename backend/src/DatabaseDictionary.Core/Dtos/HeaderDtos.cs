namespace DatabaseDictionary.Core.Dtos;

/// <summary>Full header + detail payload used for load (GET by id) and save (POST/PUT).</summary>
public class HeaderDetailDto
{
    public int HeaderId { get; set; }
    public string DatabaseName { get; set; } = string.Empty;
    public string DatabaseHost { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty;
    public string ObjectName { get; set; } = string.Empty;
    public string? TableDescription { get; set; }
    public string? OtherDescription { get; set; }
    public string? Remark { get; set; }
    public string? ConnPort { get; set; }
    public string? ConnAccount { get; set; }
    public string? ConnPassword { get; set; }
    public bool UseWindowsAuth { get; set; }
    public List<ColumnDto> Columns { get; set; } = new();
}

public class ColumnDto
{
    public int ColumnId { get; set; }
    public int Sequence { get; set; }
    public string ColumnName { get; set; } = string.Empty;
    public string? ColumnDescription { get; set; }
    public string DataType { get; set; } = string.Empty;
    public bool IsNullable { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsPrimaryKey { get; set; }
    public bool IsIdentity { get; set; }
    public string? ParamDirection { get; set; }
    public string? Remark { get; set; }
}

/// <summary>Row shown in the Tab 2 grid list — deliberately excludes connection credentials.</summary>
public class HeaderListItemDto
{
    public int HeaderId { get; set; }
    public string DatabaseHost { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty;
    public string ObjectName { get; set; } = string.Empty;
    public string? TableDescription { get; set; }
    public string? OtherDescription { get; set; }
}

public class HeaderSearchQuery
{
    public string? DatabaseName { get; set; }
    public string? ObjectName { get; set; }
    public string? ColumnName { get; set; }
    public string? Keyword { get; set; }
}

public class ProgramUsageDto
{
    public int SeqNo { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string? Description { get; set; }
}
