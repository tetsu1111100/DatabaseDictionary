using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace DatabaseDictionary.Api.Controllers;

[ApiController]
[Route("api/schema")]
public class SchemaController : ControllerBase
{
    private readonly ISchemaInspector _inspector;

    public SchemaController(ISchemaInspector inspector)
    {
        _inspector = inspector;
    }

    /// <summary>
    /// Connects live to the source database using the credentials in the request body (saved on the header, or
    /// typed into the temporary prompt) and returns its actual column structure. Credentials here are never
    /// persisted by this endpoint.
    /// </summary>
    [HttpPost("compare")]
    public async Task<ActionResult<SchemaCompareResult>> Compare([FromBody] SchemaCompareRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DatabaseHost) || string.IsNullOrWhiteSpace(request.DatabaseName) || string.IsNullOrWhiteSpace(request.ObjectName))
        {
            return BadRequest(new { message = "資料庫主機、資料庫名稱、來源物件名稱皆為必填。" });
        }
        if (!request.UseWindowsAuth && string.IsNullOrWhiteSpace(request.ConnAccount))
        {
            return BadRequest(new { message = "未使用 Windows 整合驗證時，請提供連線帳號。" });
        }

        try
        {
            var result = await _inspector.GetActualColumnsAsync(request);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new { message = $"連線或查詢來源資料庫失敗：{ex.Message}" });
        }
    }
}
