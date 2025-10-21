"""
Table parser service for extracting and classifying tables from PDFs.

The heuristics implemented here prioritise robustness over perfect NLP. We rely
on flexible header token matching so common layout variations (e.g. "Call
Number", "Capital Call", "Recallable Distribution") can still be detected while
avoiding substring collisions such as "Recallable" erroneously matching
"Capital Call".
"""
from typing import List, Dict, Any, Optional, Set
import pdfplumber
import re


class TableParser:
    """
    Parse and classify tables from PDF documents.

    The classifier inspects header tokens and phrases to determine whether a
    table contains capital calls, distributions, or adjustments. The approach is
    deliberately token-based to remain resilient to layout noise (e.g. merged
    cells, punctuation) while ignoring substrings that would otherwise create
    false positives.
    """
    
    def __init__(self):
        pass
    
    def extract_tables(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract all tables from a PDF file
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of tables with metadata
        """
        tables = []
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                # Extract tables from the page
                page_tables = page.extract_tables()
                for table_idx, table in enumerate(page_tables):
                    if table and any(cell for row in table for cell in row if cell):  # Skip empty tables
                        tables.append({
                            'page': page_num,
                            'table_index': table_idx,
                            'data': table,
                            'type': self.classify_table_type(table),
                            'bbox': None  # Bounding box if needed
                        })
        return tables
    
    def classify_table_type(self, table: List[List[Any]]) -> str:
        """
        Classify table type based on header content
        
        Args:
            table: 2D list representing the table
            
        Returns:
            Table type ('capital_call', 'distribution', 'adjustment', 'unknown')
        """
        if not table or not table[0]:
            return 'unknown'
        
        # Tokenize header cells to avoid substring collisions (e.g., "recallable" vs "call")
        header_cells = [str(cell).lower() if cell else '' for cell in table[0]]
        header_text = ' '.join(header_cells)
        header_tokens: Set[str] = set()
        for cell in header_cells:
            header_tokens.update(re.findall(r"\b\w+\b", cell))

        # Collect representative tokens from data rows (first few rows) to catch
        # tables whose headers are generic but row content is descriptive.
        data_tokens: Set[str] = set()
        for row in table[1:4]:
            for cell in row:
                if cell:
                    data_tokens.update(re.findall(r"\b\w+\b", str(cell).lower()))

        def has_phrase(phrases: List[str]) -> bool:
            return any(phrase in header_text for phrase in phrases)

        def has_tokens(required_sets: List[Set[str]]) -> bool:
            return any(
                required <= header_tokens or required <= data_tokens
                for required in required_sets
            )

        # Adjustment indicators (checked first so "Capital Call Adjustment" rows
        # resolve to adjustments rather than capital calls).
        adjustment_phrases = [
            'adjustment',
            'adjustments',
            'amendment',
            'modification',
        ]
        adjustment_token_sets = [
            {'adjustment'},
            {'adjustments'},
            {'amendment'},
            {'modification'},
            {'change'},
        ]

        if (
            has_phrase(adjustment_phrases)
            or has_tokens(adjustment_token_sets)
            or ('adjustment' in data_tokens)
        ):
            return 'adjustment'

        # Capital call indicators
        capital_phrases = [
            'capital call',
            'capital contribution',
            'capital commitments',
            'subscription notice',
        ]
        capital_token_sets = [
            {'capital', 'call'},
            {'capital', 'contribution'},
            {'subscription', 'capital'},
            {'capital', 'commitment'},
            {'call', 'number'},
            {'capital', 'schedule'},
        ]

        if (
            has_phrase(capital_phrases)
            or has_tokens(capital_token_sets)
            or ("call" in header_tokens and "recallable" not in header_tokens)
            or ("contribution" in data_tokens and "adjustment" not in data_tokens)
        ):
            return 'capital_call'

        # Distribution indicators
        distribution_phrases = [
            'distribution',
            'distributions',
            'return of capital',
            'capital returned',
            'dividend payment',
        ]
        distribution_token_sets = [
            {'distribution'},
            {'distributions'},
            {'return', 'capital'},
            {'dividend'},
            {'payout'},
            {'repayment'},
            {'recallable'},
        ]

        if (
            has_phrase(distribution_phrases)
            or has_tokens(distribution_token_sets)
            or (
                'recallable' in header_tokens
                and 'capital' not in header_tokens
            )
            or ('distribution' in data_tokens and 'adjustment' not in data_tokens)
        ):
            return 'distribution'

        return 'unknown'
    
    def parse_table_data(self, table: List[List[Any]], table_type: str) -> List[Dict[str, Any]]:
        """
        Parse table data based on its type
        
        Args:
            table: 2D list representing the table
            table_type: Type of the table
            
        Returns:
            List of parsed records
        """
        if not table:
            return []
        
        # Use first row as headers if it looks like headers (not all numeric)
        first_row_is_header = not all(self._is_numeric_value(cell) for cell in table[0] if cell)
        
        if first_row_is_header:
            headers = [str(cell).strip() if cell else f"column_{i}" for i, cell in enumerate(table[0])]
            data_rows = table[1:]
        else:
            # If no clear header, create generic headers
            headers = [f"column_{i}" for i in range(len(table[0]) if table else 0)]
            data_rows = table
        
        records = []
        for row in data_rows:
            record = {}
            for i, value in enumerate(row):
                if i < len(headers):
                    header = headers[i]
                    record[header] = self._clean_value(value)
            if any(record.values()):  # Only add non-empty records
                record['table_type'] = table_type
                records.append(record)
        
        return records
    
    def _is_numeric_value(self, value: Any) -> bool:
        """Check if a value is numeric"""
        if value is None:
            return False
        try:
            float(str(value).replace(',', '').replace('$', '').strip())
            return True
        except ValueError:
            return False
    
    def _clean_value(self, value: Any) -> Any:
        """Clean and normalize a table cell value"""
        if value is None:
            return None
        
        str_value = str(value).strip()
        if not str_value or str_value.lower() in ['n/a', 'na', 'null', '']:
            return None
        
        # Handle currency values
        if str_value.startswith(('$', '€', '£', '¥')):
            try:
                return float(str_value[1:].replace(',', ''))
            except ValueError:
                return str_value
        
        # Handle percentage values
        if str_value.endswith('%'):
            try:
                return float(str_value[:-1]) / 100
            except ValueError:
                return str_value
        
        # Try to convert to number if it looks like one
        if ',' in str_value or self._is_numeric_value(str_value):
            try:
                return float(str_value.replace(',', ''))
            except ValueError:
                pass
        
        return str_value
