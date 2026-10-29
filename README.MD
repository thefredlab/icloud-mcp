# iCloud MCP

An open-source iCloud Model Context Protocol (MCP) server designed to seamlessly connect Apple Calendar functionality with [Poke](https://poke.com) over messaging interfaces.

## Getting Started & Setup

The easiest way to connect [Poke]([Poke](https://poke.com)) to your iCloud account is to use the dedicated web interface. You can start the automated setup process and find the complete step-by-step documentation directly on the website:

👉 **[poke.thefredlab.com](https://poke.thefredlab.com)**

The website will guide you through the necessary steps to link your iCloud account, generate the required app-specific passwords, and connect the MCP server to [Poke]([Poke](https://poke.com)).

## Features

- **Apple Calendar Integration:** Securely read and manage calendar events via iCloud.
- **Model Context Protocol (MCP):** Fully compliant with the MCP specification for seamless AI agent integration.
- **Streamlined Onboarding:** Next.js-powered web application for a frictionless user setup experience.
  - GitHub Repo for Website: [thefredlab/icloud-mcp-web](https://github.com/thefredlab/icloud-mcp-web)
- **Privacy First:** Designed to handle Apple credentials securely with AES-256 encrypted App-specific passwords.

## Local Development

If you want to contribute to the project or run the app locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/thefredlab/icloud-mcp.git
   cd icloud-mcp
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Connect to `http://localhost:8085` (default) via MCP Inspector or your preferred interface to test the integration.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to help improve the iCloud integration or the Next.js setup interface.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

## Self-hosting

You can use the [7loud/personal-mcp](https://github.com/7loud/personal-mcp) repository to self-host the iCloud MCP server. This allows you to run the server for a personal or private setup without relying on the public instance. Follow the instructions in that repository to set up your own MCP server.