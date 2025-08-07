/**
 * Configuration f  // Paragraph detection settings
  paragraphDetection: {
    // Minimum paragraph length for initial filtering - set to 1 to keep even single words
    minLength: 1,
    // Minimum lowercase ratio for normal text - very lenient to keep all content
    minLowercaseRatio: 0,
  }, PDF Paragraph Extractor
 * Modify these settings to customize the extraction behavior
 */

const config = {
  // Output directory for extracted text files
  outputDirectory: './extracted_texts',

  // Minimum paragraph length (characters) - set to 0 to keep all content
  minParagraphLength: 0,

  // Header detection settings
  headerDetection: {
    // Maximum length for potential headers
    maxHeaderLength: 60,
    // Minimum uppercase ratio for header detection
    uppercaseRatioThreshold: 0.7,
    // Leading whitespace ratio for centered text detection
    centeredTextThreshold: 0.2,
  },

  // Paragraph detection settings
  paragraphDetection: {
    // Minimum paragraph length for initial filtering - reduced to keep short sentences
    minLength: 0,
    // Minimum lowercase ratio for normal text
    minLowercaseRatio: 0.1,
  },

  // File naming
  fileNaming: {
    // Suffix to add to output files
    suffix: '_paragraphs',
    // File extension
    extension: '.txt',
  },

  // Download settings
  download: {
    // Timeout for PDF downloads (milliseconds)
    timeout: 30000,
    // Maximum file size (bytes) - 50MB default
    maxFileSize: 50 * 1024 * 1024,
  },

  // Common patterns to exclude (regex patterns)
  excludePatterns: [
    /^table of contents/i,
    /^index$/i,
    /^bibliography/i,
    /^references$/i,
    /^appendix/i,
    /^copyright/i,
    /^isbn/i,
    /^printed in/i,
    /^published by/i,
  ],

  // Header/title patterns (regex patterns)
  headerPatterns: [
    /^(chapter|section|part)\s+\d+/i,
    /^\d+\.\s*[A-Z]/,
    /^[A-Z\s]{3,}$/,
    /^page\s+\d+/i,
    /^preface$/i,
    /^introduction$/i,
    /^conclusion$/i,
    /^acknowledgments?$/i,
  ],

  // Page number patterns (regex patterns)
  pageNumberPatterns: [
    /^-\s*\d+\s*-$/,
    /^\|\s*\d+\s*\|$/,
    /^page\s+\d+$/i,
    /^\d+\s*$/,
    /^-\s*\d+$/,
    /^\d+\s*-$/,
    /^\d+$/,
    /^–\s*\d+\s*–$/,
  ],

  // Footnote patterns (regex patterns)
  footnotePatterns: [
    /^\d+\s+[a-z]/,
    /^\[\d+\]/,
    /^\*+\s/,
    /^see\s+/i,
    /^cf\.\s+/i,
    /^ibid/i,
    /^op\.\s*cit/i,
    /^\d+\.\s*[a-z]/,
  ],
};

module.exports = config;
