import Content from "./content"
import { getAllPerformanceBird } from "@/src/performance/performance.action";

export default async function Page() {
  const response = await getAllPerformanceBird();

  return <Content initialData={response} />

}