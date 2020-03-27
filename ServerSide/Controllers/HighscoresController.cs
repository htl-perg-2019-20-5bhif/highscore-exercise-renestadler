using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace ServerSide.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HighscoresController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HighscoreContext _context;

        public HighscoresController(HighscoreContext context, IConfiguration configuration)
        {
            _configuration = configuration;
            _context = context;
        }

        // GET: api/Highscores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Highscore>>> GetHighscores()
        {
            return await _context.Highscores.OrderByDescending(a => a.Score).ToListAsync();
        }

        // POST: api/Highscores
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPost]
        public async Task<ActionResult<Highscore>> PostHighscore(HighscoreDto highscore)
        {
            HttpClient httpClient = new HttpClient();
            var res = httpClient.GetAsync($"https://www.google.com/recaptcha/api/siteverify?secret=" + _configuration["GoogleReCaptcha: secret"] + "&response=" + highscore.captcha).Result;
            if (res.StatusCode != HttpStatusCode.OK)
            {
                return BadRequest("You are a bot!");
            }

            string response = res.Content.ReadAsStringAsync().Result;
            dynamic JSONdata = JObject.Parse(response);
            if (JSONdata.success != "true")
            {
                return BadRequest("You are a bot!");
            }

            return await AddHighscore(highscore.Highscore);
        }

        public async Task<ActionResult<Highscore>> AddHighscore(Highscore highscore)
        {
            if (highscore.Score < 0)
            {
                return BadRequest("Not a highScore");
            }

            var highscores = await _context.Highscores.OrderByDescending(a => a.Score).ToListAsync();
            if (highscores.Count < 10)
            {
                _context.Highscores.Add(highscore);
                await _context.SaveChangesAsync();
            }
            else
            {
                for (int i = 0; i < highscores.Count; i++)
                {
                    if (highscore.Score > highscores[i].Score)
                    {
                        _context.Remove(highscores.Last());
                        _context.Add(highscore);
                        await _context.SaveChangesAsync();
                        return Ok(highscore);
                    }
                }
            }
            return BadRequest("Not a highScore");

        }
    }
}
