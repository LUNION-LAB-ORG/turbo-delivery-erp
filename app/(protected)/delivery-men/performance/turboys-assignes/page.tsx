import { getAllPerformaneTurbo } from "@/src/performance/performance.action";
import Content from "./content"

export default async function Page() {
  const response = await getAllPerformaneTurbo();

  return <Content initialData={response} />

}