using Microsoft.EntityFrameworkCore;

namespace ServerSide
{
    public class HighscoreContext : DbContext
    {
        public DbSet<Highscore> Highscores { get; set; }

        public HighscoreContext(DbContextOptions<HighscoreContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultContainer("Highscore");
            modelBuilder.Entity<Highscore>().HasNoDiscriminator();
        }
    }
}
