import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Integration test against the database pointed to by DATABASE_URL.
// Run with: npm run test:e2e (requires `docker compose up -d postgres`).
describe('Tree CRUD (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let treeId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    if (treeId) {
      await request(server).delete(`/api/trees/${treeId}`);
    }
    await app.close();
  });

  it('runs the full lifecycle and returns the graph', async () => {
    const tree = await request(server)
      .post('/api/trees')
      .send({ title: 'E2E family' })
      .expect(201);
    treeId = tree.body.id;
    expect(tree.body.personCount).toBe(0);

    const newPerson = (givenName: string) =>
      request(server)
        .post(`/api/trees/${treeId}/persons`)
        .send({ givenName })
        .expect(201)
        .then((res) => res.body.id as string);

    const parent1 = await newPerson('Parent One');
    const parent2 = await newPerson('Parent Two');
    const child = await newPerson('Child');

    const newRel = (sourcePersonId: string, targetPersonId: string, type: string) =>
      request(server)
        .post(`/api/trees/${treeId}/relationships`)
        .send({ sourcePersonId, targetPersonId, type })
        .expect(201);

    await newRel(parent1, child, 'PARENT_CHILD');
    await newRel(parent2, child, 'PARENT_CHILD');
    await newRel(parent1, parent2, 'SPOUSE');

    const graph = await request(server).get(`/api/trees/${treeId}`).expect(200);
    expect(graph.body.personCount).toBe(3);
    expect(graph.body.persons).toHaveLength(3);
    expect(graph.body.relationships).toHaveLength(3);
  });

  it('cascades relationship deletion when a person is deleted', async () => {
    const person = await request(server)
      .post(`/api/trees/${treeId}/persons`)
      .send({ givenName: 'Temporary' })
      .expect(201);
    const target = await request(server)
      .post(`/api/trees/${treeId}/persons`)
      .send({ givenName: 'Other' })
      .expect(201);

    await request(server)
      .post(`/api/trees/${treeId}/relationships`)
      .send({ sourcePersonId: person.body.id, targetPersonId: target.body.id, type: 'SPOUSE' })
      .expect(201);

    const before = await request(server).get(`/api/trees/${treeId}`).expect(200);
    const relCountBefore = before.body.relationships.length;

    await request(server).delete(`/api/persons/${person.body.id}`).expect(204);

    const after = await request(server).get(`/api/trees/${treeId}`).expect(200);
    expect(after.body.relationships.length).toBe(relCountBefore - 1);
  });

  it('rejects an invalid tree payload with 400', async () => {
    await request(server).post('/api/trees').send({ title: '' }).expect(400);
  });

  it('rejects a cross-tree relationship with 409', async () => {
    const otherTree = await request(server)
      .post('/api/trees')
      .send({ title: 'Other tree' })
      .expect(201);
    const here = await request(server)
      .post(`/api/trees/${treeId}/persons`)
      .send({ givenName: 'Here' })
      .expect(201);
    const there = await request(server)
      .post(`/api/trees/${otherTree.body.id}/persons`)
      .send({ givenName: 'There' })
      .expect(201);

    const res = await request(server)
      .post(`/api/trees/${treeId}/relationships`)
      .send({ sourcePersonId: here.body.id, targetPersonId: there.body.id, type: 'SPOUSE' })
      .expect(409);
    expect(res.body.code).toBe('CROSS_TREE_REFERENCE');

    await request(server).delete(`/api/trees/${otherTree.body.id}`).expect(204);
  });
});
