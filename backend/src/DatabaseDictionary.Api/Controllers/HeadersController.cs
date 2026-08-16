using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DatabaseDictionary.Api.Controllers;

[ApiController]
[Route("api/headers")]
public class HeadersController : ControllerBase
{
    private readonly IHeaderRepository _repository;

    public HeadersController(IHeaderRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<List<HeaderListItemDto>>> Search(
        [FromQuery] string? dbName,
        [FromQuery] string? objectName,
        [FromQuery] string? columnName,
        [FromQuery] string? keyword)
    {
        var query = new HeaderSearchQuery
        {
            DatabaseName = dbName,
            ObjectName = objectName,
            ColumnName = columnName,
            Keyword = keyword
        };
        var result = await _repository.SearchAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HeaderDetailDto>> GetById(int id)
    {
        var header = await _repository.GetByIdAsync(id);
        if (header is null)
        {
            return NotFound(new { message = "找不到指定的表頭資料。" });
        }
        return Ok(header);
    }

    [HttpPost]
    public async Task<ActionResult<HeaderDetailDto>> Create([FromBody] HeaderDetailDto header)
    {
        var validationError = Validate(header);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var isDuplicate = await _repository.ExistsDuplicateAsync(header.DatabaseHost, header.DatabaseName, header.ObjectName, null);
        if (isDuplicate)
        {
            return Conflict(new { message = "資料庫主機、來源資料庫名稱、來源物件名稱的組合已存在，請確認後再存檔。" });
        }

        var headerId = await _repository.CreateAsync(header);
        var created = await _repository.GetByIdAsync(headerId);
        return CreatedAtAction(nameof(GetById), new { id = headerId }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<HeaderDetailDto>> Update(int id, [FromBody] HeaderDetailDto header)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound(new { message = "找不到指定的表頭資料。" });
        }

        var validationError = Validate(header);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var isDuplicate = await _repository.ExistsDuplicateAsync(header.DatabaseHost, header.DatabaseName, header.ObjectName, id);
        if (isDuplicate)
        {
            return Conflict(new { message = "資料庫主機、來源資料庫名稱、來源物件名稱的組合已存在，請確認後再存檔。" });
        }

        header.HeaderId = id;
        await _repository.UpdateAsync(header);
        var updated = await _repository.GetByIdAsync(id);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return NotFound(new { message = "找不到指定的表頭資料。" });
        }

        await _repository.DeleteAsync(id);
        return NoContent();
    }

    private static string? Validate(HeaderDetailDto header)
    {
        if (string.IsNullOrWhiteSpace(header.DatabaseName))
        {
            return "來源資料庫名稱為必填欄位。";
        }
        if (string.IsNullOrWhiteSpace(header.DatabaseHost))
        {
            return "資料庫主機為必填欄位。";
        }
        if (string.IsNullOrWhiteSpace(header.ObjectType))
        {
            return "物件類型為必填欄位。";
        }
        if (string.IsNullOrWhiteSpace(header.ObjectName))
        {
            return "來源物件名稱為必填欄位。";
        }
        return null;
    }
}
