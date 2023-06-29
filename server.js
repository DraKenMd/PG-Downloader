
const express = require('express');
const ytSearch = require('yt-search');
const ytdl = require('ytdl-core');
const fs = require('fs');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/download', (req, res) => {
  const query = req.body.query;

  searchYouTube(query)
    .then((videos) => {
      if (videos.length > 0) {
        const video = videos[0];
        const url = video.url;

        downloadVideo(url)
  .then((videoFileName) => {
    console.log('Vídeo baixado:', videoFileName);
    res.render('index', { videoFileName });
    deleteVideo(videoFileName);
  })
          .catch((error) => {
            console.error('Erro ao baixar o vídeo:', error);
            res.render('index', { error: true });
          });
      } else {
        console.log('Nenhum vídeo encontrado.');
        res.render('index', { error: true });
      }
    })
    .catch((error) => {
      console.error('Erro ao pesquisar no YouTube:', error);
      res.render('index', { error: true });
    });
});

function searchYouTube(query) {
  return new Promise((resolve, reject) => {
    ytSearch(query, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.videos);
      }
    });
  });
}

const ytdlp = require('ytdl-core-discord');

function downloadVideo(url) {
  return new Promise((resolve, reject) => {
    const videoFileName = `${Date.now()}.mp4`;
    const options = {
      filter: 'audioandvideo',
    };

    ytdl.getBasicInfo(url, options)
      .then((info) => {
        const videoDuration = parseInt(info.videoDetails.lengthSeconds);
        if (videoDuration > 900) {
          reject(new Error('O vídeo tem mais de 15 minutos e não pode ser baixado.'));
          return;
        }

        const videoStream = ytdl(url, options);
        const writeStream = fs.createWriteStream(`public/videos/${videoFileName}`);

        videoStream
          .on('error', (error) => {
            reject(error);
          })
          .pipe(writeStream)
          .on('finish', () => {
            resolve(videoFileName);
          })
          .on('error', (error) => {
            reject(error);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

///////////////////////////////////////

function deleteVideo(videoFileName) {
  setTimeout(() => {
    const filePath = `public/videos/${videoFileName}`;

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Erro ao excluir o vídeo:', err);
      } else {
        console.log('Vídeo excluído:', videoFileName);
      }
    });
  }, 900000); // 15 Minutos
}

///////////////////////////////////////

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
