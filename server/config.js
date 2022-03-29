import { join } from 'path'

const root = process.cwd()

export const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  dir: {
    root,
    public: join(root, 'public'),
    audio: join(root, 'audio'),
    songs: join(root, 'audio', 'songs'),
    fx: join(root, 'audio', 'fx')
  },
  pages: {
    home: 'home/index.html',
    controller: 'controller/index.html'
  },
  location: {
    home: `/home`
  },
  contentType: {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript'
  },
  audioSetup: {
    mediaType: 'mp3',
    volume: '0.99',
    bitRate: '128000',
    conversation: join(root, 'audio', 'songs', 'conversation.mp3')
  }
}
