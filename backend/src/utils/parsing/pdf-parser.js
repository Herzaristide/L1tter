const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdf = require('pdf-parse');
const config = require('./config');

class PDFParagraphExtractor {
  constructor(customConfig = {}) {
    this.config = { ...config, ...customConfig };
    this.outputDir = this.config.outputDirectory;
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Download PDF from URL
   * @param {string} url - URL of the PDF file
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async downloadPDF(url) {
    try {
      console.log(`Downloading PDF from: ${url}`);
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: this.config.download.timeout,
        maxContentLength: this.config.download.maxFileSize,
      });

      console.log(
        `PDF downloaded successfully. Size: ${response.data.length} bytes`
      );
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  /**
   * Check if a line is likely a header/title
   * Headers are usually shorter, centered, and may be in caps
   * @param {string} line - Text line to check
   * @param {number} pageWidth - Estimated page width
   * @returns {boolean}
   */
  isHeader(line, pageWidth = 80) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) return true;

    // Check against exclude patterns
    if (this.config.excludePatterns.some((pattern) => pattern.test(trimmed))) {
      console.log(`📋 Header (exclude pattern): "${trimmed}"`);
      return true;
    }

    // Only treat very short lines as headers if they look like actual headers
    if (trimmed.length < 3) {
      // Only filter out lines with 1-2 characters if they're clearly not content
      const notContentPatterns = [
        /^[IVX]+$/, // Roman numerals only
        /^[\d\-\|\.]+$/, // Only numbers, dashes, pipes, dots
      ];
      return notContentPatterns.some((pattern) => {
        const matches = pattern.test(trimmed);
        if (matches) {
          console.log(`📋 Header (short pattern): "${trimmed}"`);
        }
        return matches;
      });
    }

    // Short lines that look like dialogue or sentences should not be treated as headers
    if (trimmed.length < 10) {
      const contentPatterns = [
        /^["'].*["']$/, // Quoted text
        /[.!?]$/, // Ends with punctuation
        /^[a-z]/, // Starts with lowercase (likely continuation)
        /\b(yes|no|okay|oh|ah|well|but|and|or|so|if|when|where|how|what|why|who|the|a|an|in|on|at|to|for|with|by|from|up|about|into|through|during|before|after|above|below|over|under)\b/i,
        /[a-z].*[a-z]/, // Contains multiple letters (likely words)
      ];
      if (contentPatterns.some((pattern) => pattern.test(trimmed))) {
        return false; // This looks like content, not a header
      }

      // Check if it's a clear header pattern
      const headerPatterns = [
        /^[IVX]+$/, // Roman numerals
        /^\d+$/, // Pure numbers
        /^[A-Z\s]+$/, // All caps
      ];
      return headerPatterns.some((pattern) => {
        const matches = pattern.test(trimmed);
        if (matches) {
          console.log(`📋 Header (header pattern): "${trimmed}"`);
        }
        return matches;
      });
    }

    // Lines that are mostly uppercase (likely titles/headers)
    const uppercaseRatio =
      (trimmed.match(/[A-Z]/g) || []).length / trimmed.length;
    if (
      uppercaseRatio > this.config.headerDetection.uppercaseRatioThreshold &&
      trimmed.length < this.config.headerDetection.maxHeaderLength
    ) {
      console.log(`📋 Header (uppercase): "${trimmed}"`);
      return true;
    }

    // Lines that appear centered (have significant leading whitespace)
    const leadingSpaces = line.length - line.trimStart().length;
    if (
      leadingSpaces >
        pageWidth * this.config.headerDetection.centeredTextThreshold &&
      trimmed.length < this.config.headerDetection.maxHeaderLength
    ) {
      console.log(`📋 Header (centered): "${trimmed}"`);
      return true;
    }

    // Check against header patterns
    const headerMatch = this.config.headerPatterns.some((pattern) =>
      pattern.test(trimmed)
    );
    if (headerMatch) {
      console.log(`📋 Header (config pattern): "${trimmed}"`);
    }
    return headerMatch;
  }

  /**
   * Check if a line is likely a page number
   * @param {string} line - Text line to check
   * @returns {boolean}
   */
  isPageNumber(line) {
    const trimmed = line.trim();
    const isPageNum = this.config.pageNumberPatterns.some((pattern) =>
      pattern.test(trimmed)
    );
    return isPageNum;
  }

  /**
   * Check if a line is likely a paragraph
   * @param {string} line - Text line to check
   * @returns {boolean}
   */
  isParagraph(line) {
    const trimmed = line.trim();

    // Skip completely empty lines
    if (trimmed.length === 0) return false;

    // Accept any non-empty text - no length or character composition requirements
    // Even single words, numbers, or symbols can be valid content

    // Should not be a header, page number, or footnote
    if (this.isHeader(line) || this.isPageNumber(line)) {
      return false;
    }

    return true;
  }

  /**
   * Clean and merge paragraph lines
   * @param {string[]} lines - Array of text lines
   * @returns {string[]} - Array of cleaned paragraphs
   */
  extractParagraphs(lines) {
    const paragraphs = [];
    let currentParagraph = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
        continue;
      }

      // Check if this line is a paragraph
      if (this.isParagraph(line)) {
        // Check if previous line ended with hyphen (for word joining)
        const prevLineEndedWithHyphen = currentParagraph.endsWith('-');

        // Clean the trimmed line to normalize spaces
        let cleanedLine = this.cleanText(trimmed);

        // If the line doesn't end with punctuation, it might continue on the next line
        if (currentParagraph) {
          // If previous line ended with hyphen, don't add space (join words directly)
          if (prevLineEndedWithHyphen) {
            // Remove the hyphen from currentParagraph and join without space
            currentParagraph = currentParagraph.slice(0, -1) + cleanedLine;
          } else {
            // Remove hyphen at end of current line if it exists (word split across lines)
            currentParagraph += ' ' + cleanedLine;
          }
        } else {
          // Remove hyphen at end of current line if it exists (word split across lines)

          currentParagraph = cleanedLine;
        }

        // If line ends with sentence-ending punctuation, finish the paragraph
        if (/[.!?]$/.test(cleanedLine)) {
          paragraphs.push(this.cleanText(currentParagraph));
          currentParagraph = '';
        }
      } else {
        // Not a paragraph line, finish current paragraph if any
        if (currentParagraph.trim()) {
          paragraphs.push(this.cleanText(currentParagraph));
          currentParagraph = '';
        }
      }
    }

    // Add any remaining paragraph
    if (currentParagraph.trim()) {
      paragraphs.push(this.cleanText(currentParagraph));
    }

    // Merge paragraphs split by page breaks
    const mergedParagraphs = this.mergePageBreakSplits(paragraphs);

    // Clean each paragraph to remove extra spaces
    const cleanedParagraphs = mergedParagraphs.map((p) => this.cleanText(p));

    // Only filter out completely empty paragraphs, keep all content
    return cleanedParagraphs.filter((p) => p.length > 0);
  }

  /**
   * Merge paragraphs that were split by page breaks
   * @param {string[]} paragraphs - Array of paragraphs
   * @returns {string[]} - Array of merged paragraphs
   */
  mergePageBreakSplits(paragraphs) {
    const merged = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const current = paragraphs[i].trim();

      if (merged.length === 0) {
        merged.push(current);
        continue;
      }

      const previous = merged[merged.length - 1];

      // Check if the previous paragraph doesn't end with proper punctuation
      // and the current paragraph doesn't start with a capital letter
      // This indicates a page break split
      const prevEndsWithoutPunctuation = !/[.!?;:]$/.test(previous);
      const currentStartsLowercase = /^[a-z]/.test(current);
      const prevEndsWithHyphen = /-$/.test(previous);

      // Also check for common split patterns
      const prevEndsWithIncomplete =
        /\b(and|or|but|the|a|an|in|on|at|to|for|with|by|from|of|up|about|into|through|during|before|after|above|below|over|under|however|therefore|nevertheless|furthermore|moreover|additionally|consequently|subsequently|meanwhile|otherwise|nonetheless|thus|hence|accordingly|indeed|certainly|obviously|clearly|apparently|presumably|arguably|essentially|basically|generally|specifically|particularly|especially|notably|remarkably|surprisingly|unfortunately|fortunately|interestingly|importantly|significantly|ultimately|finally|initially|originally|previously|recently|currently|eventually|immediately|suddenly|gradually|slowly|quickly|rapidly|carefully|gently|firmly|strongly|deeply|highly|extremely|very|quite|rather|somewhat|slightly|barely|hardly|scarcely|almost|nearly|approximately|roughly|exactly|precisely|definitely|certainly|probably|possibly|perhaps|maybe|likely|unlikely|obviously|clearly|apparently|presumably|evidently|supposedly|allegedly|reportedly|seemingly|apparently|obviously)$/i.test(
          previous.split(' ').pop()
        );

      if (
        (prevEndsWithoutPunctuation && currentStartsLowercase) ||
        prevEndsWithHyphen ||
        prevEndsWithIncomplete
      ) {
        // Merge with previous paragraph
        const separator = prevEndsWithHyphen ? '' : ' '; // No space if hyphenated word
        const cleanPrevious = prevEndsWithHyphen
          ? previous.slice(0, -1)
          : previous;
        const mergedText = cleanPrevious + separator + current;
        merged[merged.length - 1] = this.cleanText(mergedText);
      } else {
        // Start new paragraph
        merged.push(this.cleanText(current));
      }
    }

    return merged;
  }

  /**
   * Clean text by removing extra spaces and normalizing whitespace
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    return (
      text
        // Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // Remove spaces before punctuation
        .replace(/\s+([.!?;:,])/g, '$1')
        // Remove spaces after opening quotes and before closing quotes
        .replace(/([""''])\s+/g, '$1')
        .replace(/\s+([""''])/g, '$1')
        // Remove spaces around hyphens in compound words
        .replace(/\s*-\s*/g, '-')
        // Trim leading and trailing spaces
        .trim()
    );
  }

  /**
   * Parse PDF and extract paragraphs
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<string[]>} - Array of paragraphs
   */
  async parsePDF(pdfBuffer) {
    try {
      console.log('Parsing PDF...');
      const data = await pdf(pdfBuffer);

      console.log(`PDF parsed. Total pages: ${data.numpages}`);
      console.log(`Raw text length: ${data.text.length} characters`);

      // Split text into lines
      const lines = data.text.split('\n');
      console.log(`Total lines: ${lines.length}`);

      // Extract paragraphs
      const paragraphs = this.extractParagraphs(lines);
      console.log(`Extracted ${paragraphs.length} paragraphs`);

      return paragraphs;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  /**
   * Save paragraphs to text file
   * @param {string[]} paragraphs - Array of paragraphs
   * @param {string} filename - Output filename
   */
  saveParagraphs(paragraphs, filename) {
    const outputPath = path.join(this.outputDir, filename);
    const content = paragraphs.join('\n\n');

    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`Paragraphs saved to: ${outputPath}`);
    console.log(`Total characters: ${content.length}`);
  }

  /**
   * Process PDF from URL
   * @param {string} url - PDF URL
   * @param {string} outputName - Output filename (optional)
   */
  async processPDFFromURL(url, outputName = null) {
    try {
      // Generate output filename if not provided
      if (!outputName) {
        const urlParts = url.split('/');
        const pdfName = urlParts[urlParts.length - 1];
        outputName = pdfName.replace('.pdf', '_paragraphs.txt');
      }

      // Download PDF
      const pdfBuffer = await this.downloadPDF(url);

      // Parse and extract paragraphs
      const paragraphs = await this.parsePDF(pdfBuffer);

      // Save paragraphs
      this.saveParagraphs(paragraphs, outputName);

      console.log(`\n✅ Successfully processed PDF from: ${url}`);
      console.log(`📄 Output file: ${path.join(this.outputDir, outputName)}`);

      return paragraphs;
    } catch (error) {
      console.error(`❌ Error processing PDF: ${error.message}`);
      throw error;
    }
  }
}

// Example usage
async function main() {
  const extractor = new PDFParagraphExtractor();

  // Example PDF URLs (replace with actual book URLs)
  const pdfURLs = [
    // Add your PDF URLs here
    // 'https://example.com/book1.pdf',
    // 'https://example.com/book2.pdf'
  ];

  // Process command line arguments
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Process URLs from command line
    for (const url of args) {
      try {
        await extractor.processPDFFromURL(url);
      } catch (error) {
        console.error(`Failed to process ${url}: ${error.message}`);
      }
    }
  } else if (pdfURLs.length > 0) {
    // Process predefined URLs
    for (const url of pdfURLs) {
      try {
        await extractor.processPDFFromURL(url);
      } catch (error) {
        console.error(`Failed to process ${url}: ${error.message}`);
      }
    }
  } else {
    console.log('📖 PDF Paragraph Extractor');
    console.log('Usage:');
    console.log('  node pdf-parser.js <pdf-url1> [pdf-url2] [pdf-url3] ...');
    console.log('');
    console.log('Example:');
    console.log('  node pdf-parser.js https://example.com/book.pdf');
    console.log('');
    console.log(
      'Or modify the pdfURLs array in the script to add your PDF URLs.'
    );
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PDFParagraphExtractor;
