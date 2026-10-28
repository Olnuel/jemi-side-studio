import type { Metadata } from "next";
import DemoIssue from "./demo-issue";

export const metadata: Metadata = {
  title: "Issue ZK-284 · Jemi Side Studio",
  description: "Follow an issue through collaborative proposal refinement and agent review.",
};

export default function DemoPage() {
  return <DemoIssue />;
}
