using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DatabaseDictionary.Api.Controllers;

[ApiController]
[Route("api/headers/{headerId:int}/program-usage")]
public class ProgramUsageController : ControllerBase
{
    private readonly IProgramUsageRepository _repository;

    public ProgramUsageController(IProgramUsageRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProgramUsageDto>>> GetAll(int headerId)
    {
        if (!await _repository.HeaderExistsAsync(headerId))
        {
            return NotFound(new { message = "找不到指定的表頭資料，請先儲存表頭。" });
        }

        var result = await _repository.GetByHeaderIdAsync(headerId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<List<ProgramUsageDto>>> ReplaceAll(int headerId, [FromBody] List<ProgramUsageDto> items)
    {
        if (!await _repository.HeaderExistsAsync(headerId))
        {
            return NotFound(new { message = "找不到指定的表頭資料，請先儲存表頭。" });
        }

        if (items.Any(i => string.IsNullOrWhiteSpace(i.ProgramName)))
        {
            return BadRequest(new { message = "程式名稱為必填欄位。" });
        }

        await _repository.ReplaceAllAsync(headerId, items);
        var result = await _repository.GetByHeaderIdAsync(headerId);
        return Ok(result);
    }
}
