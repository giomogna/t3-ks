import React from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { UserNav } from "~/components/user-nav";
import { cn } from "~/utils";
import { api } from "~/utils/api";

export default function Dashboard() {
  const utils = api.useContext();
  const [value, setValue] = React.useState("");
  const getAll = api.todo.getAll.useQuery();
  const create = api.todo.create.useMutation({
    onSuccess: () => {
      void utils.todo.getAll.invalidate();
    },
  });
  const update = api.todo.update.useMutation({
    onSettled: () => {
      void utils.todo.getAll.invalidate();
    },
    onMutate: async ({ id, isDone }) => {
      await utils.todo.getAll.cancel();

      const prevData = utils.todo.getAll.getData();

      utils.todo.getAll.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((todo) => {
          if (todo.id === id) {
            return {
              ...todo,
              isDone,
            };
          }
          return todo;
        });
      });

      return { prevData };
    },
    onError: (err, variables, context) => {
      if (context?.prevData) {
        utils.todo.getAll.setData(undefined, context.prevData);
      }
    },
  });

  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>

      <div className="mt-36 flex items-center justify-center">
        <Card className="w-1/2">
          <CardHeader>
            <CardTitle>Todo List</CardTitle>
            <CardDescription>
              A list of things that need to be done.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                value={value}
                onChange={(e) => setValue(e.currentTarget.value)}
              />
              <Button
                variant="secondary"
                className="shrink-0"
                disabled={!value || create.isLoading}
                onClick={() => {
                  create.mutate({ title: value });
                  setValue("");
                }}
              >
                Add Todo
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Your Todos</h4>
              <div className="grid gap-6">
                {getAll.data
                  ?.sort((a, b) => Number(a.isDone) - Number(b.isDone))
                  .map((todo) => (
                    <div className="flex items-center space-x-4" key={todo.id}>
                      <Checkbox
                        checked={todo.isDone}
                        onCheckedChange={(checked) => {
                          update.mutate({
                            id: todo.id,
                            isDone: Boolean(checked),
                          });
                        }}
                      />
                      <div>
                        <p
                          className={cn("text-sm font-medium leading-none", {
                            "line-through": todo.isDone,
                          })}
                        >
                          {todo.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {todo.createdAt.toLocaleString("it-IT")}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
