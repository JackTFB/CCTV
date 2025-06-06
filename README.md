# CCTV - Content Creator Television

CCTV is a multi-platform content aggregator that allows users to view all content from their favorite content creators across YouTube, Twitch, TikTok, and potentially other platforms. The app creates a personalized, 24/7 streaming experience similar to traditional cable television.

## Features (Planned)

- **Multi-Platform Integration**: Connect to YouTube, Twitch, TikTok and more
- **Content Creator Subscriptions**: Follow your favorite creators across platforms
- **Continuous Feed**: 24/7 personalized content stream
- **Cable-Like Interface**: Easy channel browsing and content discovery
- **Cross-Platform Support**: iOS, Android, Web, and Desktop

## Technologies

- **Framework**: React Native with Expo
- **Authentication**: OAuth 2.0 for various platforms
- **Storage**: SQLite for local data
- **State Management**: React Context API
- **API Integration**: YouTube Data API, Twitch API, TikTok API

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/CCTV.git
   cd CCTV/CCTV
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

## Project Structure

- `/app` - Main application screens using Expo Router
- `/components` - Reusable UI components
- `/config` - Configuration files
- `/context` - React Context providers
- `/docs` - Documentation files
- `/hooks` - Custom React hooks
- `/services` - API and authentication services

## Roadmap

See the [TODOLIST.txt](TODOLIST.txt) file for the current development roadmap.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
