# Hammamet Connect — frontend and backend class diagram

This diagram follows the current React report workflow through the Laravel API to its persisted models. `ReportRecord` describes the JSON shape consumed by React; `Report` is the Eloquent model.

```mermaid
classDiagram
    direction LR

    class ReportRecord {
        <<API DTO>>
        +String id
        +String reference
        +String title
        +String description
        +String category
        +String urgency
        +String status
        +Integer reports
        +String location
        +Number[] coordinates
        +String date
        +String importance
        +String assigned_service
    }

    class ReportService {
        <<React service>>
        +list()
        +get(id)
        +update(id, changes)
    }
    class ApiReportTransport {
        <<HTTP transport>>
        +GET /api/reports
        +GET /api/reports/{reference}
        +PATCH /api/reports/{reference}
    }
    class UseReports {
        <<React hook>>
        +ReportRecord[] reports
        +Boolean loading
        +String error
        +refresh()
    }
    class AppRoutes {
        <<React router>>
        +dashboard()
        +map()
        +reports()
        +reportDetail(reference)
        +analytics()
        +services()
        +settings()
    }
    class OverviewPage {
        <<React page>>
    }
    class ReportsPage {
        <<React page>>
        +filterByStatus()
        +filterUrgent()
        +search(query)
    }
    class DetailPage {
        <<React page>>
        +updateStatus(status, rejectionReason, staffNote)
    }
    class MapPage {
        <<React page>>
    }
    class AnalyticsPage {
        <<React page>>
    }
    class ServicesPage {
        <<React page>>
    }

    class ReportController {
        <<Laravel API controller>>
        +index()
        +show(report)
        +update(request, report)
    }
    class UpdateReportRequest {
        <<Laravel form request>>
        +status
        +rejection_reason
        +staff_note
    }
    class ReportResource {
        <<JSON serializer>>
        +toArray()
    }
    class MunicipalServiceController {
        <<Laravel API controller>>
        +index()
    }
    class MunicipalServiceResource {
        <<JSON serializer>>
        +toArray()
    }
    class Report {
        <<Eloquent model>>
        +String reference
        +String title
        +String description
        +String category
        +String urgency
        +String status
        +Integer contributions_count
        +String location
        +Float latitude
        +Float longitude
        +DateTime submitted_at
    }
    class MunicipalService {
        <<Eloquent model>>
        +String name
        +String category
        +String assigned_service_name
        +Integer agent_count
        +Integer resolution_rate
    }
    class Evidence {
        <<Eloquent model>>
        +String storage_disk
        +String storage_path
        +String original_name
        +String mime_type
        +Integer size
    }
    class ReportStatusHistory {
        <<Eloquent model>>
        +String from_status
        +String to_status
        +DateTime occurred_at
        +String rejection_reason
        +String note
    }
    class StaffNote {
        <<Eloquent model>>
        +String note
        +DateTime created_at
    }

    ReportService --> ApiReportTransport : sends HTTP requests
    ApiReportTransport --> ReportController : calls API routes
    ReportController --> UpdateReportRequest : validates updates
    ReportController --> ReportResource : serializes reports
    ReportResource --> ReportRecord : produces matching JSON
    ReportController --> Report : reads and updates
    MunicipalServiceController --> MunicipalServiceResource : serializes services
    MunicipalServiceController --> MunicipalService : reads
    MunicipalServiceResource --> MunicipalService : maps to frontend service shape

    Report "many" --> "1" MunicipalService : assigned service
    Report "1" *-- "0..*" Evidence : attachments
    Report "1" *-- "0..*" ReportStatusHistory : history
    Report "1" *-- "0..*" StaffNote : staff notes

    UseReports --> ReportService : loads and refreshes
    DetailPage --> ReportService : updates status
    AppRoutes --> OverviewPage : routes to
    AppRoutes --> ReportsPage : routes to
    AppRoutes --> DetailPage : routes to
    AppRoutes --> MapPage : routes to
    AppRoutes --> AnalyticsPage : routes to
    AppRoutes --> ServicesPage : routes to
    OverviewPage --> UseReports : reads reports
    ReportsPage --> UseReports : reads and filters reports
    DetailPage --> UseReports : reads report and refreshes
    MapPage ..> ReportRecord : displays report locations
    AnalyticsPage --> UseReports : derives sample metrics
```

## API behavior matching the frontend

- `GET /api/reports` returns a plain JSON array, so existing report list, overview, and map consumers receive the expected collection shape.
- Report IDs in the API are the human-readable references such as `HC-2026-041`, matching frontend routes and links.
- `PATCH /api/reports/{reference}` accepts a status and optional staff note. A `rejected` status requires a rejection reason.
- Status changes create a history record. A non-empty staff note is saved both with a status change and when the status remains the same.
- The `reports` and `assigned_service` JSON fields map from persisted contribution counts and municipal-service records.
- Seeded report records match the current frontend demonstration sample. Dashboard chart series and recent activity still come from static frontend mock data.
