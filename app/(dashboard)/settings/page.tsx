import React, { Suspense } from "react";
import Loading from "@/components/layouts/loading";
export default async function Page() {
  return (
    <Suspense fallback={<Loading/>}>

    </Suspense>
  );
}
