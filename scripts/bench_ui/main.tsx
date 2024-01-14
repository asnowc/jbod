/// <reference lib="dom" />
import React from "react";
import { createRoot } from "react-dom/client";
import { BenchmarkPage } from "./components/benchmark.tsx";

const rootEle = document.getElementById("app")!;

createRoot(rootEle).render(<App />);

function App() {
  return <BenchmarkPage />;
}
