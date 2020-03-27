using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ServerSide;
using ServerSide.Controllers;
using System.Linq;
using Xunit;

namespace HighscoreAPITest
{
    public class UnitTest1
    {
        HighscoreContext dataContext;
        HighscoresController controller;

        public UnitTest1()
        {
            var options = new DbContextOptionsBuilder<HighscoreContext>().UseCosmos("https://cosmosdbstadler.documents.azure.com:443",
            "2p0GxSmhfq07FtMrjS5pyWDJi5ZMfMqb0B413XdpKU2QgYplUqY1oDs3LOBvHtGaknsSIt4jIhvlXLQejSqXvg==", "HighscoreExercise").Options;
            dataContext = new HighscoreContext(options);
            controller = new HighscoresController(dataContext, Mock.Of<IConfiguration>());
        }

        [Fact]
        public async void NewHighestHighscore()
        {
            dataContext.Highscores.RemoveRange((await controller.GetHighscores()).Value);
            await dataContext.SaveChangesAsync();
            Highscore highscore;
            for (var i = 1; i < 12; i++)
            {
                highscore = new Highscore();
                highscore.Score = 100 * i;
                highscore.Initials = "AS" + i;
                await controller.AddHighscore(highscore);
            }
            highscore = new Highscore();
            highscore.Score = 999999;
            highscore.Initials = "ASD";
            await controller.AddHighscore(highscore);
            var highscores = await controller.GetHighscores();
            Assert.Equal(highscore.Score, (await controller.GetHighscores()).Value.ElementAt(0).Score);
            dataContext.Highscores.RemoveRange((await controller.GetHighscores()).Value);
            await dataContext.SaveChangesAsync();
        }

        [Fact]
        public async void AddHighscore()
        {
            dataContext.Highscores.RemoveRange((await controller.GetHighscores()).Value);
            await dataContext.SaveChangesAsync();
            Highscore Highscore = new Highscore();
            Highscore.Score = 1150;
            Highscore.Initials = "ASD";
            await controller.AddHighscore(Highscore);
            Assert.Single((await controller.GetHighscores()).Value);
            dataContext.Highscores.RemoveRange((await controller.GetHighscores()).Value);
            await dataContext.SaveChangesAsync();
        }

        [Fact]
        public async void GetOrderdList()
        {
            Highscore Highscore = new Highscore();
            Highscore.Score = 176;
            Highscore.Initials = "ECF";
            await controller.AddHighscore(Highscore);
            Highscore = new Highscore();
            Highscore.Score = 150;
            Highscore.Initials = "ASD";
            await controller.AddHighscore(Highscore);
            Highscore = new Highscore();
            Highscore.Score = 200;
            Highscore.Initials = "FGH";
            await controller.AddHighscore(Highscore);
            var list = (await controller.GetHighscores()).Value.ToArray();
            Assert.True(list[0].Score >= list[1].Score);
            Assert.True(list[1].Score >= list[2].Score);
            Assert.True(list[0].Score >= 200);
            dataContext.Highscores.RemoveRange((await controller.GetHighscores()).Value);
            await dataContext.SaveChangesAsync();
        }

        [Fact]
        public async void AddMoreThenTenHighscores()
        {

            for (var i = 1; i < 12; i++)
            {
                Highscore Highscore = new Highscore();
                Highscore.Score = 100 * i;
                Highscore.Initials = "" + i;
                await controller.AddHighscore(Highscore);
            }
            Assert.Equal(10, (await controller.GetHighscores()).Value.Count());
            dataContext.Highscores.RemoveRange((await controller.GetHighscores()).Value);
            await dataContext.SaveChangesAsync();
        }

        [Fact]
        public async void SendFalseRequest()
        {
            dataContext.Highscores.RemoveRange((await controller.GetHighscores()).Value);
            await dataContext.SaveChangesAsync();
            Highscore Highscore = new Highscore();
            Highscore.Score = -150;
            await controller.AddHighscore(Highscore);
            Assert.Empty((await controller.GetHighscores()).Value);
        }
    }
}