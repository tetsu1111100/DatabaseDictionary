using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DatabaseDictionary.Api.Controllers;

/// <summary>Pure T-SQL text generation from whatever the client currently has on screen — never touches the source database.</summary>
[ApiController]
[Route("api/sql")]
public class SqlController : ControllerBase
{
    private readonly ITSqlGenerator _generator;

    public SqlController(ITSqlGenerator generator)
    {
        _generator = generator;
    }

    [HttpPost("create-table")]
    public ActionResult<SqlTextResult> CreateTable([FromBody] CreateTableSqlRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ObjectName))
        {
            return BadRequest(new { message = "來源物件名稱為必填欄位。" });
        }
        if (request.Columns.Count == 0)
        {
            return BadRequest(new { message = "至少需要一個欄位才能產生 CREATE TABLE SQL。" });
        }

        return Ok(new SqlTextResult { Sql = _generator.BuildCreateTable(request) });
    }

    [HttpPost("column/add")]
    public ActionResult<SqlTextResult> AddColumn([FromBody] ColumnSqlRequest request)
    {
        var error = ValidateColumnRequest(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }
        return Ok(new SqlTextResult { Sql = _generator.BuildAddColumn(request) });
    }

    [HttpPost("column/drop")]
    public ActionResult<SqlTextResult> DropColumn([FromBody] ColumnSqlRequest request)
    {
        var error = ValidateColumnRequest(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }
        return Ok(new SqlTextResult { Sql = _generator.BuildDropColumn(request) });
    }

    [HttpPost("column/alter")]
    public ActionResult<SqlTextResult> AlterColumn([FromBody] ColumnSqlRequest request)
    {
        var error = ValidateColumnRequest(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }
        return Ok(new SqlTextResult { Sql = _generator.BuildAlterColumn(request) });
    }

    private static string? ValidateColumnRequest(ColumnSqlRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ObjectName))
        {
            return "來源物件名稱為必填欄位。";
        }
        if (string.IsNullOrWhiteSpace(request.Column.ColumnName))
        {
            return "欄位名稱為必填欄位。";
        }
        return null;
    }
}
