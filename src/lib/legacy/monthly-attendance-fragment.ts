import type {
  MonthlyAttendanceCell,
  MonthlyAttendanceRow,
} from "@/app/(app)/reports/monthly/monthly-client";

const DAY_COLUMNS = Array.from({ length: 31 }, (_, index) => index + 1);

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderLinkedBadge(cell: MonthlyAttendanceCell, color: string) {
  const label = escapeHtml(cell.code);
  if (!cell.href) {
    return `<span class="badge" style="background: ${color};">${label}</span>`;
  }

  return `<a target="_blank" href="${escapeHtml(cell.href)}" class="badge" style="background: ${color};">${label}</a>`;
}

function renderAttendanceCell(cell: MonthlyAttendanceCell) {
  switch (cell.code) {
    case "N":
      return renderLinkedBadge(cell, "purple");
    case "P":
      return renderLinkedBadge(cell, "green");
    case "A":
      return renderLinkedBadge(cell, "pink");
    case "W":
      return '<span class="badge badge-danger" style="background: red;">W</span>';
    case "H":
      return '<span class="badge" style="background: yellow; color: black">H</span>';
    case "-":
      return "-";
    default:
      return "";
  }
}

function headers(includeBranch: boolean) {
  return [
    "Child #",
    "Name",
    "L Name",
    ...(includeBranch ? ["Branch"] : []),
    "Class",
    ...DAY_COLUMNS.map(String),
    "P/A",
  ];
}

function renderFilterScript(inputColumnLimit: number) {
  return `<script type="text/javascript">
    $(document).ready(function() {
        var count = 0;
        $('#datatable_ajax thead .filters th').each(function() {
            count++;
            if (count < ${inputColumnLimit}) {
                $(this).html('<input type="text" class="form-control">');
            }
        });

        var table = $('#datatable_ajax').DataTable({});

        table.columns().eq(0).each(function(colIdx) {
            $('input', table.column(colIdx).header()).on('keyup change', function() {
                table.column(colIdx).search(this.value).draw();
            });
        });
    });
</script>`;
}

export function renderMonthlyAttendanceFragment({
  rows,
  includeBranch,
}: {
  rows: MonthlyAttendanceRow[];
  includeBranch: boolean;
}) {
  const tableHeaders = headers(includeBranch);
  const headerCells = tableHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const filterCells = tableHeaders.map(() => "<th></th>").join("");
  const bodyRows = rows
    .map((row) => {
      const baseCells = [
        row.childNumber,
        row.firstName,
        row.lastName,
        ...(includeBranch ? [row.branchName] : []),
        row.className,
      ];
      const attendanceCells = row.cells.map(renderAttendanceCell);
      const presentAbsent = `${row.presentCount} / ${row.absentCount}`;
      return `<tr>${[
        ...baseCells.map((value) => `<th>${escapeHtml(value)}</th>`),
        ...attendanceCells.map((value) => `<th>${value}</th>`),
        `<th>${escapeHtml(presentAbsent)}</th>`,
      ].join("")}</tr>`;
    })
    .join("");

  return `<table class="table table-striped table-bordered table-hover" id="datatable_ajax">
    <thead>
        <tr class="heading">${headerCells}</tr>
        <tr class="filters">${filterCells}</tr>
    </thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
        <tr class="heading">${headerCells}</tr>
    </tfoot>
</table>

${renderFilterScript(includeBranch ? 6 : 5)}`;
}
