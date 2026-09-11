using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LosPellot.Api.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/contact-messages")]
public class AdminContactController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AdminContactMessageDto>>> GetAll()
    {
        var messages = await db.ContactMessages.OrderByDescending(m => m.CreatedAt).ToListAsync();
        return Ok(messages.Select(ToDto).ToList());
    }

    [HttpPatch("{id:int}/handled")]
    public async Task<ActionResult<AdminContactMessageDto>> MarkHandled(int id)
    {
        var message = await db.ContactMessages.FindAsync(id);
        if (message is null) return NotFound();

        message.HandledAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ToDto(message));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var message = await db.ContactMessages.FindAsync(id);
        if (message is null) return NotFound();

        db.ContactMessages.Remove(message);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static AdminContactMessageDto ToDto(ContactMessage m) => new(
        m.Id, m.Name, m.Email, m.Phone, m.Subject, m.Message, m.CreatedAt, m.HandledAt
    );
}
