from pypdf import PdfReader


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF document."""

    try:
        reader = PdfReader(file_path)
        extracted_pages = []

        if reader.is_encrypted:
            raise ValueError("Password-protected PDFs are not supported.")

        for page in reader.pages:
            extracted_pages.append(page.extract_text() or "")

        return "\n".join(extracted_pages).strip()

    except ValueError:
        raise
    except Exception as error:
        raise ValueError(f"PDF extraction failed: {str(error)}")
