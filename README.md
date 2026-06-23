# FlowSmart - AI-Powered SME Finance & Cash Flow Manager

FlowSmart is a production-ready web application designed for small businesses in Uganda and East Africa. It provides intelligent cash flow management, AI-powered financial forecasting, invoicing, and payment integration with Pesapal.

## 🏗️ Architecture

- **Frontend:** Vanilla HTML/CSS/JS (deployed on Cloudflare Pages)
- **Backend:** Node.js + Express REST API (deployed on Render)
- **Database:** MongoDB Atlas
- **AI:** Anthropic Claude API (claude-sonnet-4-6)
- **Auth:** JWT stored in httpOnly cookies
- **Payments:** Pesapal v3 API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Anthropic API key
- Pesapal developer account

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/flowsmart.git
cd flowsmart/backend