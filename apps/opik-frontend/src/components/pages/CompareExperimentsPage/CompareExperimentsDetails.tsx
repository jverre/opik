import React, { useEffect, useMemo } from "react";
import sortBy from "lodash/sortBy";
import {
  ArrowUpRight,
  Clock,
  Database,
  FlaskConical,
  Maximize2,
  Minimize2,
  PenLine,
} from "lucide-react";

import useAppStore from "@/store/AppStore";
import useBreadcrumbsStore from "@/store/BreadcrumbsStore";
import FeedbackScoreTag from "@/components/shared/FeedbackScoreTag/FeedbackScoreTag";
import { Experiment } from "@/types/datasets";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tag } from "@/components/ui/tag";
import { Link } from "@tanstack/react-router";
import { formatDate } from "@/lib/date";
import uniq from "lodash/uniq";
import isUndefined from "lodash/isUndefined";
import { Button } from "@/components/ui/button";
import { BooleanParam, useQueryParam } from "use-query-params";

type CompareExperimentsDetailsProps = {
  experimentsIds: string[];
  experiments: Experiment[];
};

const CompareExperimentsDetails: React.FunctionComponent<
  CompareExperimentsDetailsProps
> = ({ experiments, experimentsIds }) => {
  const workspaceName = useAppStore((state) => state.activeWorkspaceName);
  const setBreadcrumbParam = useBreadcrumbsStore((state) => state.setParam);

  const isCompare = experimentsIds.length > 1;

  const experiment = experiments[0];

  const title = !isCompare
    ? experiment?.name
    : `Compare (${experimentsIds.length})`;

  const [showCompareFeedback = false, setShowCompareFeedback] = useQueryParam(
    "scoreTable",
    BooleanParam,
    {
      updateType: "replaceIn",
    },
  );

  useEffect(() => {
    title && setBreadcrumbParam("compare", "compare", title);
    return () => setBreadcrumbParam("compare", "compare", "");
  }, [title, setBreadcrumbParam]);

  const scoreMap = useMemo(() => {
    return !isCompare
      ? {}
      : experiments.reduce<Record<string, Record<string, number>>>((acc, e) => {
          acc[e.id] = (e.feedback_scores || [])?.reduce<Record<string, number>>(
            (a, f) => {
              a[f.name] = f.value;
              return a;
            },
            {},
          );

          return acc;
        }, {});
  }, [isCompare, experiments]);

  const scoreColumns = useMemo(() => {
    return uniq(
      Object.values(scoreMap).reduce<string[]>(
        (acc, m) => acc.concat(Object.keys(m)),
        [],
      ),
    ).sort();
  }, [scoreMap]);

  const renderCompareFeedbackScoresButton = () => {
    if (!isCompare) return null;

    const text = showCompareFeedback
      ? "Collapse feedback scores"
      : "Expand feedback scores";
    const Icon = showCompareFeedback ? Minimize2 : Maximize2;

    return (
      <Button
        variant="outline"
        onClick={() => {
          setShowCompareFeedback(!showCompareFeedback);
        }}
      >
        <Icon className="mr-2 size-4 shrink-0" />
        {text}
      </Button>
    );
  };

  const renderSubSection = () => {
    if (isCompare) {
      const tag =
        experimentsIds.length === 2 ? (
          <Tag size="lg" variant="gray" className="flex items-center gap-2">
            <FlaskConical className="size-4 shrink-0" />
            <div className="truncate">{experiments[1]?.name}</div>
          </Tag>
        ) : (
          <Tag size="lg" variant="gray">
            {`${experimentsIds.length - 1} experiments`}
          </Tag>
        );

      return (
        <div className="flex items-center gap-2">
          Baseline of
          <Tag size="lg" variant="gray" className="flex items-center gap-2">
            <FlaskConical className="size-4 shrink-0" />
            <div className="truncate">{experiment?.name}</div>
          </Tag>
          compared against
          {tag}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <PenLine className="size-4 shrink-0" />
          <div className="flex gap-1 overflow-x-auto">
            {sortBy(experiment?.feedback_scores ?? [], "name").map(
              (feedbackScore) => {
                return (
                  <FeedbackScoreTag
                    key={feedbackScore.name + feedbackScore.value}
                    label={feedbackScore.name}
                    value={feedbackScore.value}
                  />
                );
              },
            )}
          </div>
        </div>
      );
    }
  };

  const renderCompareFeedbackScores = () => {
    if (!isCompare || !showCompareFeedback) return null;

    return (
      <div className="mt-4 max-h-[227px] overflow-auto rounded-md border">
        {experiments.length ? (
          <table className="min-w-full table-fixed caption-bottom text-sm">
            <TableBody>
              {experiments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex h-14 min-w-20 items-center truncate p-2">
                      {e.name}
                    </div>
                  </TableCell>
                  {scoreColumns.map((id) => {
                    const value = scoreMap[e.id]?.[id];

                    return (
                      <TableCell key={id}>
                        <div className="flex h-14 min-w-20 items-center truncate p-2">
                          {isUndefined(value) ? (
                            "–"
                          ) : (
                            <FeedbackScoreTag
                              key={id + value}
                              label={id}
                              value={value}
                            />
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </table>
        ) : (
          <div className="flex h-28 items-center justify-center text-muted-slate">
            No feedback scores for selected experiments
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="comet-title-l">{title}</h1>
        {renderCompareFeedbackScoresButton()}
      </div>
      <div className="mb-2 flex gap-4 overflow-x-auto">
        {!isCompare && (
          <Tag size="lg" variant="gray" className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            <div className="truncate">{formatDate(experiment?.created_at)}</div>
          </Tag>
        )}
        <Link
          to={"/$workspaceName/datasets/$datasetId/items"}
          params={{ workspaceName, datasetId: experiment?.dataset_id }}
          className="max-w-full"
        >
          <Tag size="lg" variant="gray" className="flex items-center gap-2">
            <Database className="size-4 shrink-0" />
            <div className="truncate">{experiment?.dataset_name}</div>
            <ArrowUpRight className="size-4 shrink-0" />
          </Tag>
        </Link>
      </div>
      {renderSubSection()}
      {renderCompareFeedbackScores()}
    </div>
  );
};

export default CompareExperimentsDetails;