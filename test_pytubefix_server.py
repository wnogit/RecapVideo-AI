from pytubefix import YouTube
import os

yt = YouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
print(f'Title: {yt.title}')
print(f'Duration: {yt.length}s')

stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
if stream:
    print(f'Stream: {stream.resolution}')
    path = stream.download(output_path='/tmp', filename='test_dl.mp4')
    size = os.path.getsize(path)
    print(f'Downloaded: {size/1024/1024:.2f} MB')
    os.remove(path)
    print('SUCCESS!')
else:
    print('No stream found')
