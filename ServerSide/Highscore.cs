using System;

namespace ServerSide
{
    public class Highscore
    {
        public Guid ID { get; set; } = Guid.NewGuid();

        public string Initials { get; set; }

        public int Score { get; set; }
    }
}
