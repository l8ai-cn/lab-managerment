import { Tabs } from "antd";
import { SubmissionList } from "./SubmissionList";
import { TemplateList } from "./TemplateList";

export function DataReportingPage() {
  return (
    <Tabs
      items={[
        { key: "templates", label: "填报模板", children: <TemplateList /> },
        { key: "submissions", label: "填报记录", children: <SubmissionList /> },
      ]}
    />
  );
}
