using LosPellot.Api.Data;
using LosPellot.Api.DTOs;
using LosPellot.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace LosPellot.Api.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ContactMessageDto>> Create(CreateContactMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Completa todos los campos requeridos." });
        }

        var message = new ContactMessage
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone?.Trim(),
            Subject = request.Subject,
            Message = request.Message.Trim(),
        };

        db.ContactMessages.Add(message);
        await db.SaveChangesAsync();

        return Ok(new ContactMessageDto(message.Id));
    }
}
