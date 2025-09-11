/**
 * This plugin enforces any Uint8Array type declaration to explicitly define
 * an ArrayBuffer as generic type.
 * This is to address a TS change where ArrayBufferLike (default type parameter)
 * is no longer compatible with ArrayBuffer (which is required by e.g. the WebCrypto API and Blobs),
 * due to newly introduced discrepancies between ArrayBuffer and SharedArrayBuffer.
 * More context at:
 *  - https://github.com/microsoft/TypeScript/pull/59417
 *  - https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/
 */
export default {
    meta: {
        type: 'problem',
        fixable: 'code',
        messages: {
            missingGeneric: 'Uint8Array must be used as Uint8Array<ArrayBuffer>.',
            wrongGeneric: "Uint8Array generic argument must be exactly 'ArrayBuffer'.",
        },
        schema: [],
    },
    create(context) {
        /**
         * We need to catch all `Uint8Array` type references without an `<ArrayBuffer>` specifier.
         * This means triggering in all cases without diamonds except for:
         * - instatiations (`new Uint8Array()`) and
         * - static calls (`Uint8Array.whatever()`)
         */

        function checkTypeReference(node) {
            if (
                node.typeName?.type === "Identifier" &&
                node.typeName.name === "Uint8Array"
            ) {
                const typeArgs = node.typeArguments?.params || [];

                if (typeArgs.length === 0) {
                context.report({
                    node,
                    messageId: "missingGeneric",
                    fix(fixer) {
                    return fixer.insertTextAfter(node.typeName, "<ArrayBuffer>");
                    },
                });
                } else {
                const arg = typeArgs[0];
                const isArrayBuffer =
                    arg.type === "TSTypeReference" &&
                    arg.typeName?.type === "Identifier" &&
                    arg.typeName.name === "ArrayBuffer";

                if (!isArrayBuffer) {
                    context.report({
                    node: arg,
                    messageId: "wrongGeneric",
                    });
                }
            }
        }

        // recursion not needed since all nodes are visited by TSTypeReference
    }

    return {
      // Directly catch all type references anywhere
      TSTypeReference(node) {
        checkTypeReference(node);
      },
    };
  },
};