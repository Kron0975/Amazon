import pymupdf


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF document.
    """

    try:
        extracted_text = ""

        with pymupdf.open(file_path) as pdf_document:

            for page in pdf_document:
                extracted_text += page.get_text()

        return extracted_text.strip()

    except Exception as error:
        raise ValueError(f"PDF extraction failed: {str(error)}")