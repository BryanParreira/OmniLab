<div align="center">

<img src="icon.png" alt="OmniLab Logo" width="120" height="120">

# OmniLab

### The Cognitive AI Operating System

**Run powerful AI workflows locally. No clouds. No limits. Pure intelligence.**
<div align="center">

<img src="icon.png" alt="OmniLab Logo" width="120" height="120">

OmniLab

The Cognitive AI Operating System

Run powerful AI workflows locally. No clouds. No limits. Pure intelligence.

Download • Features • Documentation • Support

</div>

🎯 What is OmniLab?

OmniLab is not a chatbot—it's a local-first cognitive workspace engineered for heavy intellectual lifting. Built for engineers, architects, researchers, and writers who demand total privacy, zero latency, and uncompromising computational power.

Every interaction stays on your machine. Every model runs locally through Ollama. Every decision remains yours.

🚀 Quick Start

Prerequisites

Before installing OmniLab, ensure you have Git installed (required for Forge mode) and that you have set up the underlying AI runtime (Ollama).

🛠️ Step 1: Install Ollama & Gemma 3

OmniLab relies on Ollama to run local models. You must install Ollama and download the Gemma 3 4B model before launching the app.

1. Install Ollama Runtime

Operating System

Installation

macOS

Download .dmg and install.

Windows

Download .exe and install.

Linux

Run: `curl -fsSL https://ollama.com/install.sh

2. Download the Model

Open your terminal (Command Prompt, PowerShell, or Terminal) and run the following command to download and verify the model:

ollama run gemma3:4b


Wait for the download to complete. Once you see the prompt >>>, the model is ready. Type /bye to exit.

📥 Step 2: Install OmniLab

<table>
<tr>
<td width="33%" align="center">

macOS

Download .dmg

Intel & Apple Silicon

</td>
<td width="33%" align="center">

Windows

Download .exe

x86_64 & ARM64

</td>
<td width="33%" align="center">

Linux

Download .AppImage

Universal Binary

</td>
</tr>
</table>

Setup Steps:

Download the appropriate binary for your platform

Install by double-clicking the installer or executable

OmniLab automatically detects Ollama on startup

Select Forge or Nexus mode from the home screen

⚡ Core Capabilities

🔧 Forge Mode: Engineering & Architecture

The thinking environment for builders—designed to move faster and ship better.

Blueprint Engine

Scaffold entire project structures in seconds. Define folder hierarchies, boilerplate code, and configuration files through natural language. OmniLab writes the architecture directly to your filesystem.

Prompt: "Create a Next.js SaaS starter with TypeScript, Tailwind, and Stripe"

Result:
├── src/
│   ├── pages/
│   ├── components/
│   └── lib/
├── tailwind.config.ts
├── stripe.config.ts
└── package.json


Diff Doctor

Integrated with Git. Analyze uncommitted changes, surface bugs before they're committed, and auto-generate thoughtful commit messages. Never push incomplete work again.

Refactor

Context-aware code cleaning. Improve readability, consistency, and maintainability without breaking functionality.

📚 Nexus Mode: Research & Writing

The thinking environment for synthesis—learn deeper and remember better.

Flashpoint

Upload PDFs, research papers, or notes. OmniLab instantly transforms them into spaced-repetition flashcards. Build active recall workflows at scale.

Podcast Protocol

Complex synthesis deserves a voice. Text-to-speech rendering turns long-form summaries and analyses into listenable audio. Learn while you commute.

Deep Context

Semantic vector search across document collections. Find connections across hundreds of pages in milliseconds. Navigate ideas your linear brain might miss.

🧪 Lab Bench

The centerpiece of OmniLab's interface—a split-screen artifact viewer that eliminates window-switching.

✨ Live HTML/JS previews rendered side-by-side with chat

📋 Full-height code reviews without scrolling chaos

🎴 Flashcard studying while you work

🔄 Seamless mode switching without leaving the workspace

The Lab Bench is where thinking and building converge.

🔒 Privacy & Security

OmniLab is built on a single principle: your data never leaves your machine.

Feature

Guarantee

100% Local

Ollama runs on your hardware. No API calls. No analytics. No servers.

Proprietary Models

Bring your own model via Ollama. Use Llama 2, Mistral, or any GGUF-compatible model.

Zero Telemetry

OmniLab doesn't phone home. Ever.

Offline Capable

Works offline after launch (except for initial Ollama downloads).

This is cognitive AI without compromise.

📊 Comparison Matrix

 

OmniLab

Generic Chatbot

Local-First

✅

❌

Code Scaffolding

Full projects

Snippets only

Git Integration

Native

None

Flashcard System

Automatic

Manual/External

Audio Synthesis

Built-in

Copy-paste required

Split-Screen Interface

Native

Multiple windows

Privacy Guarantees

Absolute

Terms of Service

💼 Usage Examples

Forge Mode Workflow

Project Scaffolding

Prompt: "Create a Next.js SaaS starter with TypeScript, Tailwind, and Stripe"


OmniLab scaffolds 20+ files instantly with production-ready configuration.

Pre-Commit Analysis

git diff


OmniLab detects issues, flags concerns, and writes commit messages automatically.

Nexus Mode Workflow

Upload Documents

Upload: research_paper.pdf + notes.md


OmniLab Creates:

✓ 50 active-recall flashcards

✓ Searchable vector index

✓ 15-minute audio summary (Podcast Protocol)

Open the Lab Bench, flip between flashcards and chat. Study while you think.

💻 System Requirements

Requirement

Specification

Operating System

macOS 11+, Windows 10+, Ubuntu 20.04+

RAM

8GB minimum (16GB recommended for large models)

Disk Space

20GB+ free space for models

Ollama

Latest version, running on port 11434

Git

Latest version (Forge mode only)

🔗 Resources

GitHub Repository — Source & development

Downloads — Latest releases & builds

Issue Tracker — Bugs & feature requests

📄 License

OmniLab is proprietary software.

License:      Proprietary / Closed Source
Copyright:    © 2024 Bryan Bernardo Parreira. All Rights Reserved
Usage:        Free for personal and commercial purposes
Restrictions: Modification, reverse engineering, or redistribution is prohibited


For licensing questions, please open an issue.

🤝 Support

Encounter a bug? Have a feature idea? 

Open an issue on GitHub →

OmniLab is built with meticulous attention to detail. Your feedback shapes the roadmap.

<div align="center">

Built by Bryan Bernardo Parreira

The operating system for cognitive work.

</div>
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/BryanParreira/OmniLab/releases)
[![Ollama](https://img.shields.io/badge/powered%20by-Ollama-black.svg)](https://ollama.ai)

[Download](#-installation) • [Features](#-core-capabilities) • [Documentation](#-quick-start) • [Support](#-support)

---

</div>

## 🎯 What is OmniLab?

OmniLab is not a chatbot—it's a **local-first cognitive workspace** engineered for heavy intellectual lifting. Built for engineers, architects, researchers, and writers who demand total privacy, zero latency, and uncompromising computational power.

Every interaction stays on your machine. Every model runs locally through Ollama. Every decision remains yours.

<br>

## 🚀 Quick Start

### Prerequisites

Before installing OmniLab, ensure you have:

- **[Ollama](https://ollama.ai)** (latest version, running on port 11434)
- **[Git](https://git-scm.com)** (latest version, required for Forge mode)

### Installation

<table>
<tr>
<td width="33%" align="center">

**macOS**

[Download .dmg](https://github.com/BryanParreira/OmniLab/releases)

Intel & Apple Silicon

</td>
<td width="33%" align="center">

**Windows**

[Download .exe](https://github.com/BryanParreira/OmniLab/releases)

x86_64 & ARM64

</td>
<td width="33%" align="center">

**Linux**

[Download .AppImage](https://github.com/BryanParreira/OmniLab/releases)

Universal Binary

</td>
</tr>
</table>

**Setup Steps:**

1. Download the appropriate binary for your platform
2. Install by double-clicking the installer or executable
3. OmniLab automatically detects Ollama on startup
4. Select **Forge** or **Nexus** mode from the home screen

<br>

## ⚡ Core Capabilities

### 🔧 Forge Mode: Engineering & Architecture

*The thinking environment for builders—designed to move faster and ship better.*

#### **Blueprint Engine**
Scaffold entire project structures in seconds. Define folder hierarchies, boilerplate code, and configuration files through natural language. OmniLab writes the architecture directly to your filesystem.

```
Prompt: "Create a Next.js SaaS starter with TypeScript, Tailwind, and Stripe"

Result:
├── src/
│   ├── pages/
│   ├── components/
│   └── lib/
├── tailwind.config.ts
├── stripe.config.ts
└── package.json
```

#### **Diff Doctor**
Integrated with Git. Analyze uncommitted changes, surface bugs before they're committed, and auto-generate thoughtful commit messages. Never push incomplete work again.

#### **Refactor**
Context-aware code cleaning. Improve readability, consistency, and maintainability without breaking functionality.

---

### 📚 Nexus Mode: Research & Writing

*The thinking environment for synthesis—learn deeper and remember better.*

#### **Flashpoint**
Upload PDFs, research papers, or notes. OmniLab instantly transforms them into spaced-repetition flashcards. Build active recall workflows at scale.

#### **Podcast Protocol**
Complex synthesis deserves a voice. Text-to-speech rendering turns long-form summaries and analyses into listenable audio. Learn while you commute.

#### **Deep Context**
Semantic vector search across document collections. Find connections across hundreds of pages in milliseconds. Navigate ideas your linear brain might miss.

---

### 🧪 Lab Bench

**The centerpiece of OmniLab's interface**—a split-screen artifact viewer that eliminates window-switching.

- ✨ Live HTML/JS previews rendered side-by-side with chat
- 📋 Full-height code reviews without scrolling chaos
- 🎴 Flashcard studying while you work
- 🔄 Seamless mode switching without leaving the workspace

*The Lab Bench is where thinking and building converge.*

<br>

## 🔒 Privacy & Security

OmniLab is built on a single principle: **your data never leaves your machine**.

| Feature | Guarantee |
|:--------|:----------|
| **100% Local** | Ollama runs on your hardware. No API calls. No analytics. No servers. |
| **Proprietary Models** | Bring your own model via Ollama. Use Llama 2, Mistral, or any GGUF-compatible model. |
| **Zero Telemetry** | OmniLab doesn't phone home. Ever. |
| **Offline Capable** | Works offline after launch (except for initial Ollama downloads). |

*This is cognitive AI without compromise.*

<br>

## 📊 Comparison Matrix

|  | OmniLab | Generic Chatbot |
|:---|:---:|:---:|
| **Local-First** | ✅ | ❌ |
| **Code Scaffolding** | Full projects | Snippets only |
| **Git Integration** | Native | None |
| **Flashcard System** | Automatic | Manual/External |
| **Audio Synthesis** | Built-in | Copy-paste required |
| **Split-Screen Interface** | Native | Multiple windows |
| **Privacy Guarantees** | Absolute | Terms of Service |

<br>

## 💼 Usage Examples

### Forge Mode Workflow

**Project Scaffolding**
```
Prompt: "Create a Next.js SaaS starter with TypeScript, Tailwind, and Stripe"
```

OmniLab scaffolds 20+ files instantly with production-ready configuration.

**Pre-Commit Analysis**
```bash
git diff
```

OmniLab detects issues, flags concerns, and writes commit messages automatically.

---

### Nexus Mode Workflow

**Upload Documents**
```
Upload: research_paper.pdf + notes.md
```

**OmniLab Creates:**
- ✓ 50 active-recall flashcards
- ✓ Searchable vector index
- ✓ 15-minute audio summary (Podcast Protocol)

Open the Lab Bench, flip between flashcards and chat. Study while you think.

<br>

## 💻 System Requirements

| Requirement | Specification |
|:------------|:--------------|
| **Operating System** | macOS 11+, Windows 10+, Ubuntu 20.04+ |
| **RAM** | 8GB minimum (16GB recommended for large models) |
| **Disk Space** | 20GB+ free space for models |
| **Ollama** | Latest version, running on port 11434 |
| **Git** | Latest version (Forge mode only) |

<br>

## 🔗 Resources

- **[GitHub Repository](https://github.com/BryanParreira/OmniLab)** — Source & development
- **[Downloads](https://github.com/BryanParreira/OmniLab/releases)** — Latest releases & builds
- **[Issue Tracker](https://github.com/BryanParreira/OmniLab/issues)** — Bugs & feature requests

<br>

## 📄 License

**OmniLab** is proprietary software.

```
License:      Proprietary / Closed Source
Copyright:    © 2024 Bryan Bernardo Parreira. All Rights Reserved
Usage:        Free for personal and commercial purposes
Restrictions: Modification, reverse engineering, or redistribution is prohibited
```

For licensing questions, please [open an issue](https://github.com/BryanParreira/OmniLab/issues).

<br>

## 🤝 Support

Encounter a bug? Have a feature idea? 

**[Open an issue on GitHub →](https://github.com/BryanParreira/OmniLab/issues)**

OmniLab is built with meticulous attention to detail. Your feedback shapes the roadmap.

<br>

---

<div align="center">

**Built by Bryan Bernardo Parreira**

*The operating system for cognitive work.*

<br>

[![GitHub stars](https://img.shields.io/github/stars/BryanParreira/OmniLab?style=social)](https://github.com/BryanParreira/OmniLab)
[![GitHub forks](https://img.shields.io/github/forks/BryanParreira/OmniLab?style=social)](https://github.com/BryanParreira/OmniLab)

</div>
