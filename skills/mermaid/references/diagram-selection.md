# Diagram selection

Pick a diagram type from **intent**, then open the linked syntax reference in this folder (one hop from `SKILL.md`). Do not duplicate full syntax here.

## By intent

| Intent | Prefer | Reference |
| ------ | ------ | --------- |
| Steps, branches, loops, pipelines | Flowchart | [flowchart.md](flowchart.md) |
| Request/response, actors, time order | Sequence | [sequenceDiagram.md](sequenceDiagram.md) |
| Code-style sequence (alternative notation) | ZenUML | [zenuml.md](zenuml.md) |
| Classes, interfaces, inheritance, associations | Class | [classDiagram.md](classDiagram.md) |
| DB tables, keys, cardinality | ER | [entityRelationshipDiagram.md](entityRelationshipDiagram.md) |
| Lifecycle, states, transitions | State | [stateDiagram.md](stateDiagram.md) |
| System/context/container/component (C4) | C4 | [c4.md](c4.md) |
| Services, deployment-style architecture | Architecture | [architecture.md](architecture.md) |
| Blocks / components without C4 ceremony | Block | [block.md](block.md) |
| Branches, merges, release lines | Git graph | [gitgraph.md](gitgraph.md) |
| Schedules, phases, dependencies | Gantt | [gantt.md](gantt.md) |
| Proportions | Pie | [pie.md](pie.md) |
| Hierarchy of concepts | Mindmap | [mindmap.md](mindmap.md) |
| Chronological story | Timeline | [timeline.md](timeline.md) |
| 2×2 positioning | Quadrant | [quadrantChart.md](quadrantChart.md) |
| Requirements ↔ elements | Requirement | [requirementDiagram.md](requirementDiagram.md) |
| Magnitude flows | Sankey | [sankey.md](sankey.md) |
| Plots (bars/lines) | XY chart | [xyChart.md](xyChart.md) |
| Layered comparison | Radar | [radar.md](radar.md) |
| Nested share or size | Treemap | [treemap.md](treemap.md) |
| UX steps / satisfaction | User journey | [userJourney.md](userJourney.md) |
| Board columns | Kanban | [kanban.md](kanban.md) |
| Packet layouts | Packet | [packet.md](packet.md) |

## Splitting work

If one diagram mixes many concerns (e.g. domain model + HTTP trace + infra), split into multiple diagrams and cross-reference them in prose.
