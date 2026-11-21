import 'package:material_ui/material_ui.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

/// Pemutar YouTube di dalam aplikasi (mode privasi youtube-nocookie bawaan paket).
class YoutubeView extends StatefulWidget {
  const YoutubeView({super.key, required this.videoId});

  final String videoId;

  @override
  State<YoutubeView> createState() => _YoutubeViewState();
}

class _YoutubeViewState extends State<YoutubeView> {
  late final YoutubePlayerController _controller = YoutubePlayerController.fromVideoId(
    videoId: widget.videoId,
    autoPlay: false,
    params: const YoutubePlayerParams(showFullscreenButton: true, strictRelatedVideos: true),
  );

  @override
  void dispose() {
    _controller.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: YoutubePlayer(controller: _controller, aspectRatio: 16 / 9),
    );
  }
}
