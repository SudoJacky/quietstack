import { getCollection } from 'astro:content';
import { collectContentIntegrityIssues } from './content-integrity.js';

let validationPromise: Promise<void> | undefined;

export async function validateContentIntegrity() {
  validationPromise ??= runValidation();
  return validationPromise;
}

async function runValidation() {
  const [posts, notes, pages, series, sources] = await Promise.all([
    getCollection('posts'),
    getCollection('notes'),
    getCollection('pages'),
    getCollection('series'),
    getCollection('sources'),
  ]);

  const { errors, warnings } = collectContentIntegrityIssues({ posts, notes, pages, series, sources });
  if (warnings.length) {
    console.warn(`Content integrity warnings:\n${warnings.map((warning) => `- ${warning}`).join('\n')}`);
  }

  if (errors.length) {
    throw new Error(`Content integrity validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}
