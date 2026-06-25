export const TEXT_TO_DIAGRAM_PROMPT = `You are a diagram generator. Given a text description, generate a flowchart or diagram as structured JSON.

Output ONLY valid JSON, no explanation. Format:
{
  "nodes": [
    { "id": "n1", "type": "rect|diamond|ellipse|sticky", "label": "Step description", "x": 0, "y": 0 }
  ],
  "edges": [
    { "from": "n1", "to": "n2", "label": "condition or action" }
  ]
}

Rules:
- Use "diamond" for decisions, "rect" for processes, "ellipse" for start/end, "sticky" for notes
- Arrange nodes vertically (y increases downward) with 130px vertical spacing, 280px horizontal spacing
- For linear flows: single column starting at x=400
- For branches: split horizontally with 280px gap between branches
- Start nodes at x=400, y=100
- Keep labels short (3-8 words)
- Use node IDs like "n1", "n2", etc.
- Return ONLY the JSON object`;

export const CANVAS_TO_CODE_PROMPT = `You are an AI assistant that reads a visual workflow diagram and generates corresponding code or a task plan.

You will receive a text description of shapes and their connections on a whiteboard canvas. Each shape has a type (Process, Decision, Start/End, Note) and a label. Arrows show the flow between shapes, sometimes with conditions.

Based on this workflow, generate:
1. A structured task plan or code implementation
2. Use JavaScript by default unless the context suggests another language
3. Format output as clean, readable code with comments explaining each step
4. If it is a business process, output a task breakdown instead of code

Format your response as a single code block with the appropriate language tag.`;
