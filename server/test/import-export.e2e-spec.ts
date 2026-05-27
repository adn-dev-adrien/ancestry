import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Integration test against the database pointed to by DATABASE_URL.
// Run with: npm run test:e2e (requires `docker compose up -d postgres`).
describe('Import / Export (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  const createdTreeIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    for (const id of createdTreeIds) {
      await request(server).delete(`/api/trees/${id}`);
    }
    await app.close();
  });

  async function seedTree(): Promise<string> {
    const tree = await request(server).post('/api/trees').send({ title: 'Source' }).expect(201);
    createdTreeIds.push(tree.body.id);
    const p1 = await request(server)
      .post(`/api/trees/${tree.body.id}/persons`)
      .send({ givenName: 'Ada' })
      .expect(201);
    const p2 = await request(server)
      .post(`/api/trees/${tree.body.id}/persons`)
      .send({ givenName: 'Bob', gender: 'MALE' })
      .expect(201);
    await request(server)
      .post(`/api/trees/${tree.body.id}/relationships`)
      .send({ sourcePersonId: p1.body.id, targetPersonId: p2.body.id, type: 'PARENT_CHILD' })
      .expect(201);
    return tree.body.id;
  }

  it('exports a tree and re-imports it as a new tree with an identical graph', async () => {
    const sourceId = await seedTree();

    const exported = await request(server).get(`/api/trees/${sourceId}/export`).expect(200);
    expect(exported.body.version).toBe(1);
    expect(exported.body.persons).toHaveLength(2);
    expect(exported.body.relationships).toHaveLength(1);

    const imported = await request(server).post('/api/trees/import').send(exported.body).expect(201);
    createdTreeIds.push(imported.body.id);
    expect(imported.body.id).not.toBe(sourceId);
    expect(imported.body.personCount).toBe(2);

    const graph = await request(server).get(`/api/trees/${imported.body.id}`).expect(200);
    expect(graph.body.persons).toHaveLength(2);
    expect(graph.body.relationships).toHaveLength(1);
    expect(graph.body.persons.map((p: { givenName: string }) => p.givenName).sort()).toEqual([
      'Ada',
      'Bob',
    ]);
  });

  it('replaces an existing tree content from a file', async () => {
    const sourceId = await seedTree();
    const exported = await request(server).get(`/api/trees/${sourceId}/export`).expect(200);

    const target = await request(server).post('/api/trees').send({ title: 'Target' }).expect(201);
    createdTreeIds.push(target.body.id);
    await request(server)
      .post(`/api/trees/${target.body.id}/persons`)
      .send({ givenName: 'ToBeReplaced' })
      .expect(201);

    await request(server).post(`/api/trees/${target.body.id}/import`).send(exported.body).expect(200);

    const graph = await request(server).get(`/api/trees/${target.body.id}`).expect(200);
    expect(graph.body.title).toBe('Source');
    expect(graph.body.persons).toHaveLength(2);
    expect(graph.body.relationships).toHaveLength(1);
  });

  it('rejects a malformed payload with 400', async () => {
    await request(server).post('/api/trees/import').send({ version: 2 }).expect(400);
  });
});
