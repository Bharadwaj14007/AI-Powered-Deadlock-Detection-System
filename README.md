# AI-Powered Deadlock Detection System

A React + TypeScript dashboard for analyzing resource-allocation states, detecting deadlocks, and simulating recovery strategies in a browser-based environment.

## Overview

This project helps visualize operating-system deadlock scenarios using:

- Banker's Algorithm to determine whether a system is in a safe state
- Wait-for Graph analysis to detect circular wait dependencies
- A heuristic risk engine to explain why a scenario is becoming dangerous
- Resolution previews that simulate possible corrective actions before applying them

It is designed as an educational, interactive tool for learning deadlock detection and prevention.

## Features

- Scenario editor with preset templates and custom matrix editing
- Dynamic validation for allocation, maximum, and need data
- Safe sequence and execution-step tracing using Banker's Algorithm
- Wait-for Graph rendering with detected dependency cycles
- Risk scoring with explainable factor contributions
- Resolution simulation with before/after comparison
- Local persistence using browser storage for analysis history

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

## Project Structure

- `src/components/` — UI panels and dashboard sections
- `src/algorithms/` — deadlock detection, risk, and resolution logic
- `src/types.ts` — shared TypeScript models
- `src/presets.ts` — default scenario presets

## Getting Started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the URL shown in the terminal, typically:

```text
http://127.0.0.1:5174/
```

### Build for production

```bash
npm run build
```

## How to Use

1. Choose a preset or create a custom process/resource scenario.
2. Review the input matrices and fix any validation messages.
3. Run analysis to see the current state, safe sequence, cycles, and risk score.
4. Inspect the wait-for graph and recommendation panel.
5. Preview and apply simulated recovery strategies.

## Limitations

This application is a browser-based educational simulator. It does not control real system processes and does not use a trained AI model for detection.

## License

This project is provided for learning and demonstration purposes.
