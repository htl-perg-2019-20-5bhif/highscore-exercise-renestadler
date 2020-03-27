using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace ServerSide
{
    public class HighscoreContext : DbContext
    {
        public DbSet<Highscore> Highscores { get; set; }

        public HighscoreContext(DbContextOptions<HighscoreContext> options, IConfiguration configuration) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
