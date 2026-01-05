// Basic implementation of the output parser
export const parseOutputElements = (output: string) => {
    if (!output) return [];
    // Split by newlines and handle basic formatting
    // This is a simplified version of what might be in the original Vue project
    return [{ type: 'text', content: [{ type: 'text', content: output }] }];
};
