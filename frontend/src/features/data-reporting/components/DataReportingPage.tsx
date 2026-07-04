import { Tabs } from "antd";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { SubmissionStatsCharts } from "./SubmissionStatsCharts";
import { SubmissionList } from "./SubmissionList";
import { TemplateList } from "./TemplateList";

export function DataReportingPage() {
  return (
    <>
      <PageHeader />
      <ContentCard>
        <Tabs
          items={[
            { key: "templates", label: "填报模板", children: <TemplateList /> },
            { key: "submissions", label: "填报记录", children: <SubmissionList /> },
            { key: "stats", label: "统计图表", children: <SubmissionStatsCharts /> },
          ]}
        />
      </ContentCard>
    </>
  );
}
