"use client";

import React, {
    createContext,
    Fragment,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    ExpandedState,
    FilterFn,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    RowData,
    SortingState,
    Table as TanstackTable,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
// import { rankItem } from "@tanstack/match-sorter-utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { clsx } from "clsx";

function useIsMounted() {
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);
    return isMountedRef;
}

interface DataTableV2ContextType<TData, TValue> {
    table: TanstackTable<TData>;
    columns: ColumnDef<TData, TValue>[];
    // getRowCanExpand: (row: Row<TData>) => boolean;
    setSorting: (sorting: SortingState) => void;
    setGlobalFilter: (globalFilter: string) => void;
    empty: React.ReactNode;
    setEmpty: (empty: React.ReactNode) => void;
    selectedRows: Row<RowData>[];
    isRootMounted?: boolean;
    data?: any[];
}

const DataTableV2Context = createContext<DataTableV2ContextType<any, any>>({
    table: {} as any,
    columns: [],
    // getRowCanExpand: () => false,
    setSorting: () => { },
    empty: <div>Aucune donnée</div>,
    setEmpty: () => { },
    setGlobalFilter: () => { },
    selectedRows: [],
});

export function useDataTableV2<TData, TValue>() {
    if (!DataTableV2Context) {
        throw new Error("useDataTableV2 must be used within a DataTableV2.Root");
    }
    return useContext(DataTableV2Context) as DataTableV2ContextType<
        TData,
        TValue
    >;
}

interface DataTableProps<TData, TValue> {
    columns?: ColumnDef<TData, TValue>[];
    data: TData[];
    children: React.ReactNode;
    selectionMultiple?: boolean;
    onSelection?: (selectedRows: Row<RowData>[]) => void;
}
function Root<TData, TValue>({
    columns,
    data,
    children,
    selectionMultiple,
    onSelection,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [expanded, setExpanded] = React.useState<ExpandedState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const [globalFilter, setGlobalFilter] = React.useState("");
    const [empty, setEmpty] = React.useState<React.ReactNode>(
        <div>Aucune donnée</div>
    );
    const { current: isMounted } = useIsMounted();

    // Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
    const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
        // Rank the item
        // const itemRank = rankItem(row.getValue(columnId), value);

        // // Store the itemRank info
        // addMeta({
        //     itemRank,
        // });

        // // Return if the item should be filtered in/out
        // return itemRank.passed;
        return false;
    };

    useEffect(() => {
        onSelection && onSelection(table.getFilteredSelectedRowModel().rows);
    }, [rowSelection]);

    const table = useReactTable({
        data,
        columns: columns || [],
        enableRowSelection: true,
        enableMultiRowSelection: selectionMultiple,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onExpandedChange: setExpanded,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "fuzzy" as any, //apply fuzzy filter to the global filter (most common use case for fuzzy filter)
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        // getRowCanExpand,
        state: {
            sorting,
            columnFilters,
            expanded,
            rowSelection,
            globalFilter,
        },
    });
    return (
        <DataTableV2Context.Provider
            value={{
                table,
                columns: columns || [],
                setSorting,
                empty,
                setEmpty,
                setGlobalFilter,
                selectedRows: table.getFilteredSelectedRowModel().rows,
                isRootMounted: isMounted,
                data,
            }}
        >
            {isMounted && children}
        </DataTableV2Context.Provider>
    );
}
Root.displayName = "DataTable.Root";

interface PaginationProps {
    mini?: boolean;
}

function Pagination({ mini }: PaginationProps) {
    const { table } = useDataTableV2();

    return (
        <>
            {
                <div className="flex items-center justify-between px-2 my-2">
                    <div
                        className={clsx("text-sm text-muted-foreground", {
                            hidden: mini,
                            "flex-1": !mini,
                        })}
                    >
                        {table.getFilteredSelectedRowModel().rows.length} sur{" "}
                        {table.getFilteredRowModel().rows.length} ligne(s) sélectionnée(s).
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className={clsx("text-sm font-medium", { hidden: mini })}>
                                Eléments par page
                            </p>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue
                                        placeholder={table.getState().pagination.pageSize}
                                    />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div
                            className={clsx(
                                "flex  items-center justify-center text-sm font-medium",
                                { "w-[100px]": !mini }
                            )}
                        >
                            Page {table.getState().pagination.pageIndex + 1} sur{" "}
                            {table.getPageCount()}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <DoubleArrowLeftIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeftIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <DoubleArrowRightIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            }
        </>
    );
}
Pagination.displayName = "DataTable.Pagination";

type TableElementProps = {
    onRowClick?: (row: any) => void;
    noPagination?: boolean;
    responsive?: boolean;
    expandedRow?: (row: any) => React.ReactNode;
};
function TableElement({
    onRowClick,
    noPagination,
    responsive,
    expandedRow,
}: TableElementProps) {
    const { table, columns, empty, data } = useDataTableV2();
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        if (data && data?.length > 0) {
            setHasData(true);
        } else {
            setHasData(false);
        }
    }, [table, data]);

    const hasFooter = columns.some((column) => column.footer);

    return (
        <>
            {
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className={clsx(
                                                    "bg-white text-red-500 font-bold text-sm",
                                                    { "whitespace-nowrap": responsive }
                                                )}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {hasData ? (
                                <>
                                    {table.getRowModel().rows.map((row, index) => (
                                        <Fragment key={row.id}>
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                                onClick={() => onRowClick && onRowClick(row)}
                                                className={index % 2 === 0 ? "bg-gray-100" : ""}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className={"px-4"}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                            {row.getIsExpanded() && (
                                                <TableRow className={"border border-primary rounded"}>
                                                    {/* 2nd row is a custom 1 cell row */}
                                                    <TableCell
                                                        className={"p-4"}
                                                        colSpan={row.getVisibleCells().length}
                                                    >
                                                        {expandedRow && expandedRow(row)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))}
                                </>
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-full text-center"
                                    >
                                        {empty}
                                    </TableCell>
                                </TableRow>
                            )}

                            {hasFooter &&
                                table.getFooterGroups().map((footerGroup) => (
                                    <TableRow key={footerGroup.id}>
                                        {footerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={clsx("bg-primary-light font-bold text-sm", {
                                                    "whitespace-nowrap": responsive,
                                                })}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.footer,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            }

            {hasData && !noPagination && <Pagination />}
        </>
    );
}
TableElement.displayName = "DataTable.Table";

type EmptyProps = {
    children: React.ReactNode;
};
function Empty({ children }: EmptyProps) {
    const { table, setEmpty, isRootMounted } = useDataTableV2();
    const { current: isMounted } = useIsMounted();

    useEffect(() => {
        if (!(table.getRowModel().rows?.length > 0) && isMounted && isRootMounted) {
            setEmpty(children);
        }
    }, [isMounted, isRootMounted]);

    return <></>;
}
Empty.displayName = "DataTable.Empty";

type ColumnProps<TData, TValue> = {
    render: (context: DataTableV2ContextType<TData, TValue>) => React.ReactNode;
};
function Consumer<TData, TValue>({ render }: ColumnProps<TData, TValue>) {
    const context = useDataTableV2<TData, TValue>();
    return <>{render(context)}</>;
}
Consumer.displayName = "DataTable.Consumer";

function SearchInput() {
    const { setGlobalFilter, isRootMounted } = useDataTableV2();

    return (
        <div className={"flex"}>
            {isRootMounted && (
                <div
                    className={
                        "flex items-center pl-2 bg-white border rounded focus-within:ring-1 focus-within:ring-primary"
                    }
                >
                    <Search />
                    <Input
                        placeholder={`Rechercher`}
                        onChange={(e) => {
                            isRootMounted && setGlobalFilter(e.target?.value);
                        }}
                        className={"bg-white border-0 focus-visible:ring-0"}
                    />
                </div>
            )}
        </div>
    );
}
SearchInput.displayName = "DataTable.SearchInput";

type TemplateProps = {
    render: (row: any) => React.ReactNode;
};
function Template({ render }: TemplateProps) {
    const {
        table,
        //  empty
    } = useDataTableV2();
    const rows = table.getRowModel().rows;

    if (!rows?.length) {
        return <>{/*empty */}</>;
    }

    return <>{rows?.map((row) => render(row?.original))}</>;
}
Template.displayName = "DataTableV2.Template";

const selectColumn = {
    id: "select",
    header: ({ table }: any) => (
        <Checkbox
            checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
        />
    ),
    cell: ({ row }: any) => (
        <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
        />
    ),
    enableSorting: false,
    enableHiding: false,
};

const expandColumn = {
    id: "details",
    header: () => null,
    cell: ({ row }: any) => (
        <div className="flex items-center w-4">
            <Button
                variant="icon"
                onClick={() => row.toggleExpanded()}
                aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
            >
                {row.getIsExpanded() ? (
                    <ChevronDown size={16} />
                ) : (
                    <ChevronRight size={16} />
                )}
            </Button>
        </div>
    ),
    enableSorting: false,
    enableHiding: false,
};

interface ResetSelectionProps {
    ref: React.RefObject<HTMLButtonElement>;
}
function ResetSelection({ ref }: ResetSelectionProps) {
    const { table } = useDataTableV2();

    useEffect(() => {
        if (ref?.current) {
            ref.current.addEventListener("click", () => {
                table.resetRowSelection(true);
            });
        }
    }, [ref]);

    return (
        <button
            ref={ref}
            className="absolute w-0 h-0 opacity-0 -translate-x-[1000%]"
        ></button>
    );
}
ResetSelection.displayName = "DataTableV2.ResetSelection";

const DataTable = {
    Root,
    Table: TableElement,
    Empty,
    Consumer,
    SearchInput,
    Template,
    Pagination,
    selectColumn,
    expandColumn,
    ResetSelection,
};

export default DataTable;
