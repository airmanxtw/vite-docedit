import * as R from "ramda";
const { pipe, indexOf, ifElse, isEmpty } = R;
import { List } from "immutable";
import { convert } from "html-to-text";
export const api = () => {
  const hello = () => "hello";

  const deleteItem = (source) => (path) => List(source).deleteIn(path).toArray();

  const updateContent = (source) => (content) => (path) =>
    List(source)
      .updateIn(path, () => convert(content, { wordwrap: 130 }).replace(/[\r\n]/g, ""))
      .toArray();

  const insertItem = (source) => (shift) => (path) =>
    pipe(
      (p) => [p, List(p).pop().toArray(), List(p).last()],
      ([path, parentPath, position]) => {
        return pipe(
          (s) =>
            ifElse(
              isEmpty,
              () => s,
              (pt) => List(s).getIn(pt)
            )(parentPath),
          (items) =>
            List(items)
              .insert(position + shift, { text: "新分項" })
              .toArray(),
          (items) =>
            ifElse(
              isEmpty,
              () => items,
              (pt) => List(source).setIn(pt, items).toArray()
            )(parentPath)
        )(source);
      }
    )(path);

  return { hello, deleteItem, updateContent, insertItem };
};
