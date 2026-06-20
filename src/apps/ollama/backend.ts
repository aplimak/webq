import type { Model } from './models';

export interface OllamaCompletionChunk {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export interface OllamaOptions {
  model: string;
  prompt: string;
  stream?: boolean; // Optional, defaults to false
  params?: {
    [key: string]: any; // Allow passing any other params directly to ollama
  };
}

export class OllamaClient {
  private readonly ollamaEndpoint: string = 'https://ollama.ring.home';
  private busy: boolean = false;

  isBusy() {
    return this.busy;
  }

  private check() {
    if (this.isBusy()) {
      throw new Error('Ollama Client is busy');
    }
  }

  /**
   * Sends a status request to the Ollama API.
   *
   * @returns A promise that resolves to the ollama status json.
   * @throws Error if the API request fails or client is busy.
   */
  async status(): Promise<string> {
    const url = `${this.ollamaEndpoint}/api/status`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();

      if (!data) {
        throw new Error(`Unexpected response from Ollama API: ${JSON.stringify(data)}`);
      }

      return data.response;
    } catch (error) {
      console.error('Error completing Ollama request:', error);
      throw error; // Re-throw the error to be handled upstream
    }
  }

  /**
   * Sends a tags request to the Ollama API.
   *
   * @returns A promise that resolves to the ollama models.
   * @throws Error if the API request fails or client is busy.
   */
  async models(): Promise<Model[]> {
    const url = `${this.ollamaEndpoint}/api/tags`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();

      if (!data || !data.models) {
        throw new Error(`Unexpected response from Ollama API: ${JSON.stringify(data)}`);
      }

      return data.models as Model[];
    } catch (error) {
      console.error('Error completing Ollama request:', error);
      throw error; // Re-throw the error to be handled upstream
    }
  }

  /**
   * Sends a request to the Ollama API and receives the full completion.
   *
   * @param options - Options for the completion request.
   * @returns A promise that resolves to the generated text.
   * @throws Error if the API request fails or client is busy.
   */
  async complete(options: OllamaOptions): Promise<string> {
    this.check();
    this.busy = true;

    const url = `${this.ollamaEndpoint}/api/generate`;

    const requestBody = {
      ...options,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();

      if (!data || !data.response) {
        throw new Error(`Unexpected response from Ollama API: ${JSON.stringify(data)}`);
      }

      return data.response; // Assuming Ollama returns the result directly
    } catch (error) {
      console.error('Error completing Ollama request:', error);
      throw error; // Re-throw the error to be handled upstream
    } finally {
      this.busy = false;
    }
  }

  /**
   * Sends a request to the Ollama API and receives the completion in chunks (streaming).
   *
   * @param options - Options for the completion request.  Must include stream: true
   * @returns A generator function that yields each chunk of the completion.
   * @throws Error if the API request fails.
   */
  async *stream(options: OllamaOptions): AsyncGenerator<OllamaCompletionChunk> {
    this.check();
    this.busy = true;

    if (!options.stream) {
      throw new Error('Streaming requires options.stream to be true.');
    }

    const url = `${this.ollamaEndpoint}/api/generate`;

    const requestBody = {
      ...options,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.pipeThrough(new TextDecoderStream());
      if (!reader) {
        return [];
      }
      let buffer = '';

      for await (const chunk of reader) {
        buffer += chunk;

        let messageBoundary = buffer.indexOf('\n');

        while (messageBoundary !== -1) {
          const message = buffer.substring(0, messageBoundary);
          buffer = buffer.substring(messageBoundary + 1);

          try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage?.response) {
              yield parsedMessage as OllamaCompletionChunk;
            }
          } catch (e) {
            console.error('Failed to parse chunk:', message, e);
          }

          messageBoundary = buffer.indexOf('\n');
        }
      }
    } catch (error) {
      console.error('Error streaming Ollama request:', error);
      throw error;
    } finally {
      this.busy = false;
    }
  }
}

export function markdownToHtml(markdownText: string) {
  const lines = markdownText.split('\n');
  let html = '';
  let inCodeBlock = false;
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line || line.length === 0) {
      continue;
    }

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        html += '<pre><code>';
      } else {
        html += '</code></pre>';
      }
      continue;
    }

    if (inCodeBlock) {
      html += formatHtml(line) + '\n';
      continue;
    }

    // Handle Lists
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        inList = true;
        listType = 'ul';
        html += '<ul>';
      } else if (listType !== 'ul') {
        html += '</ul>';
        listType = 'ul';
        html += '<ul>'; // Start a new ul
      }
      html += '<li>' + formatHtml(line.substring(2)) + '</li>';
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        inList = true;
        listType = 'ol';
        html += '<ol>';
      } else if (listType !== 'ol') {
        html += '</ol>';
        listType = 'ol';
        html += '<ol>'; // Start a new ol
      }
      html += '<li>' + formatHtml(line.substring(3)) + '</li>';
      continue;
    } else if (inList) {
      html += '</ul>';
      inList = false;
      listType = null;
    } else if (line.startsWith('|')) {
      if (tableRows.length === 0) {
        html += '<table class="table">';
      } else if (tableRows.length === 1 && line.startsWith('|-')) {
        continue;
      }
      tableRows.push(
        line
          .split('|')
          .map((cell) => cell.trim())
          .slice(1, -1)
      );
      if (tableRows.length === 1) {
        html += '<thead><tr>';
        tableRows[0]?.forEach((header) => {
          html += '<th>' + formatHtml(header) + '</th>';
        });
        html += '</tr></thead><tbody>';
      } else if (tableRows.length > 1) {
        html += '<tr>';
        tableRows[tableRows.length - 1]?.forEach((item) => {
          html += '<td>' + formatHtml(item) + '</td>';
        });
        html += '</tr>';
      }
      continue;
    } else if (tableRows.length > 0) {
      html += '</tbody></table>';
      tableRows = [];
    }

    // Handle Headings
    if (line.startsWith('# ')) {
      html += '<h1>' + formatHtml(line.substring(2)) + '</h1>';
    } else if (line.startsWith('## ')) {
      html += '<h2>' + formatHtml(line.substring(3)) + '</h2>';
    } else if (line.startsWith('### ')) {
      html += '<h3>' + formatHtml(line.substring(4)) + '</h3>';
    } else if (line !== '') {
      html += '<span>' + formatHtml(line) + '</span>';
    }
  }

  // Close any open list if it exists
  if (inList) {
    html += '</ul>';
  }
  // Close any open table if it exists
  if (tableRows.length > 0) {
    html += '</tbody></table>';
  }

  return html;

  function formatHtml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\*\*(.*?)\*\*/g, '<span class="text bold">$1</span>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }
}
